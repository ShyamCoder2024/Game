// src/store/toastStore.ts
// Simple toast notification store — no external dependencies

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
    addToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message, type = 'info', duration = 4000) => {
        const id = `toast-${++counter}-${Date.now()}`;
        set((state) => ({
            toasts: [...state.toasts.slice(-4), { id, message, type, duration }],
        }));
        // Auto-remove after duration
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, duration);
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));
