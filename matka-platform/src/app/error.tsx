'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] p-4">
            <div className="flex w-full max-w-md flex-col items-center rounded-xl bg-white p-8 text-center shadow-lg">
                <AlertTriangle className="mb-4 h-12 w-12 text-orange-500" />
                <h2 className="mb-2 text-xl font-semibold text-gray-800">
                    Something went wrong
                </h2>
                <p className="mb-6 text-sm text-gray-500">
                    An unexpected error occurred. Please try again.
                </p>
                <div className="flex w-full gap-3">
                    <button
                        onClick={reset}
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
