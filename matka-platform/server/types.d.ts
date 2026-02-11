// server/types.d.ts
// Extend Fastify types with custom request properties

import { FastifyRequest } from 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        /** Authenticated user — attached by auth.middleware */
        user: {
            id: number;
            user_id: string;
            role: 'admin' | 'supermaster' | 'master' | 'user';
            name: string;
            created_by: number | null;
        };
        /** Downline user IDs — attached by hierarchy.middleware. null = admin (sees all) */
        hierarchyScope: number[] | null;
    }
}
