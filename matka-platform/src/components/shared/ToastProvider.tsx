'use client';

// src/components/shared/ToastProvider.tsx
// Div-based toast notification UI — renders toast queue from toastStore

import { useToastStore } from '@/store/toastStore';
import { X } from 'lucide-react';

const typeStyles = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
    warning: 'bg-amber-500 text-white',
};

const typeIcons = {
    success: '🎉',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
};

export function ToastProvider() {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-xl shadow-lg animate-slideIn ${typeStyles[toast.type]}`}
                    style={{
                        animation: 'slideIn 0.3s ease-out',
                    }}
                >
                    <span className="text-sm mt-0.5">{typeIcons[toast.type]}</span>
                    <p className="flex-1 text-sm font-medium">{toast.message}</p>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
}
