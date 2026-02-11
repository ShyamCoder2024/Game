// server/utils/response.ts
// Standard API response helpers
// ALL API responses must go through these functions

import { FastifyReply } from 'fastify';

interface SuccessResponseOptions {
    data?: unknown;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    grandTotal?: Record<string, number>;
}

/**
 * Send a standardized success response
 * Format: { success: true, data: {...}, message: "...", pagination: {...}, grandTotal: {...} }
 */
export function sendSuccess(reply: FastifyReply, options: SuccessResponseOptions = {}, statusCode = 200) {
    const response: Record<string, unknown> = {
        success: true,
    };

    if (options.data !== undefined) response.data = options.data;
    if (options.message) response.message = options.message;
    if (options.pagination) response.pagination = options.pagination;
    if (options.grandTotal) response.grandTotal = options.grandTotal;

    return reply.status(statusCode).send(response);
}

/**
 * Send a standardized error response
 * Format: { success: false, error: { code: "...", message: "...", details: {...} } }
 */
export function sendError(
    reply: FastifyReply,
    code: string,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>
) {
    const response: Record<string, unknown> = {
        success: false,
        error: {
            code,
            message,
            ...(details && { details }),
        },
    };

    return reply.status(statusCode).send(response);
}
