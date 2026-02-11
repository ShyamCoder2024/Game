// server/middleware/validate.middleware.ts
// Generic Zod validation middleware for body, params, and query

import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors';

/**
 * Extract field errors from a ZodError
 */
function formatZodErrors(err: ZodError) {
    return err.issues.map((issue) => ({
        field: issue.path.map(String).join('.'),
        message: issue.message,
    }));
}

/**
 * Validate request body against a Zod schema
 */
export function validateBody(schema: ZodSchema) {
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        try {
            request.body = schema.parse(request.body);
        } catch (err) {
            if (err instanceof ZodError) {
                throw new AppError('VALIDATION_FAILED', 'Invalid request data', {
                    errors: formatZodErrors(err),
                });
            }
            throw err;
        }
    };
}

/**
 * Validate request query parameters against a Zod schema
 */
export function validateQuery(schema: ZodSchema) {
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        try {
            request.query = schema.parse(request.query) as typeof request.query;
        } catch (err) {
            if (err instanceof ZodError) {
                throw new AppError('VALIDATION_FAILED', 'Invalid query parameters', {
                    errors: formatZodErrors(err),
                });
            }
            throw err;
        }
    };
}

/**
 * Validate request params against a Zod schema
 */
export function validateParams(schema: ZodSchema) {
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        try {
            request.params = schema.parse(request.params) as typeof request.params;
        } catch (err) {
            if (err instanceof ZodError) {
                throw new AppError('VALIDATION_FAILED', 'Invalid path parameters', {
                    errors: formatZodErrors(err),
                });
            }
            throw err;
        }
    };
}
