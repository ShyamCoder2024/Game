'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
    error,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] p-4">
                    <div className="flex w-full max-w-md flex-col items-center rounded-xl bg-white p-8 text-center shadow-lg">
                        <AlertTriangle className="mb-4 h-12 w-12 text-orange-500" />
                        <h2 className="mb-2 text-xl font-semibold text-gray-800">
                            Something went wrong
                        </h2>
                        <p className="mb-6 text-sm text-gray-500">
                            An unexpected error occurred. Please try again.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
