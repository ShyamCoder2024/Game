// server/index.ts
// Matka Platform — Fastify Server Entry Point

import Fastify, { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { prisma } from './lib/prisma';
import { AppError } from './utils/errors';
import { setupRoutes } from './routes';

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = Fastify({
    logger: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
            : undefined,
    },
});

// ==========================================
// PLUGINS
// ==========================================

async function registerPlugins() {
    // CORS
    await app.register(cors, {
        origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });

    // Security headers (disabled for development contentSecurityPolicy)
    await app.register(helmet, {
        contentSecurityPolicy: process.env.NODE_ENV === 'production',
    });
}

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.setErrorHandler((error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) => {
    // Log the error
    request.log.error(error);

    // Handle AppError
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send(error.toJSON());
    }

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
        let details: unknown;
        try {
            details = JSON.parse(error.message);
        } catch {
            details = error.message;
        }
        return reply.status(400).send({
            success: false,
            error: {
                code: 'VALIDATION_FAILED',
                message: 'Validation failed',
                details,
            },
        });
    }

    // Handle Fastify validation errors
    const fastifyError = error as FastifyError;
    if (fastifyError.validation) {
        return reply.status(400).send({
            success: false,
            error: {
                code: 'VALIDATION_FAILED',
                message: fastifyError.message,
                details: fastifyError.validation,
            },
        });
    }

    // Handle unknown errors
    const statusCode = fastifyError.statusCode || 500;
    return reply.status(statusCode).send({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : error.message,
        },
    });
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', async (_request, reply) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        return reply.send({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: 'connected',
            },
        });
    } catch {
        return reply.status(503).send({
            success: false,
            error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Database connection failed',
            },
        });
    }
});

// ==========================================
// START SERVER
// ==========================================

async function start() {
    try {
        await registerPlugins();

        // Register all application routes
        await setupRoutes(app);

        // Test database connection
        await prisma.$connect();
        app.log.info('✅ Database connected');

        // Start listening
        await app.listen({ port: PORT, host: '0.0.0.0' });
        app.log.info(`🚀 Server running on http://localhost:${PORT}`);
        app.log.info(`📋 Health check: http://localhost:${PORT}/api/health`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

// Graceful shutdown
const shutdown = async () => {
    app.log.info('🛑 Shutting down server...');
    await prisma.$disconnect();
    await app.close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();

export default app;
