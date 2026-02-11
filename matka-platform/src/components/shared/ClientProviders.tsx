'use client';

// src/components/shared/ClientProviders.tsx
// Client wrapper for providers that need 'use client' in the root layout

import { ToastProvider } from './ToastProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <ToastProvider />
        </>
    );
}
