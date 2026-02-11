'use client';

// src/components/shared/ConfirmDialog.tsx
// Reusable confirmation modal for destructive actions

import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    loading = false,
}: ConfirmDialogProps) {
    if (!open) return null;

    const variantStyles = {
        danger: {
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
        },
        warning: {
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        },
        info: {
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fade-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={18} />
                </button>

                {/* Icon */}
                <div className={`w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center mb-4`}>
                    <AlertTriangle size={24} className={styles.iconColor} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 mb-6">{message}</p>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button
                        className={styles.buttonClass}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            confirmLabel
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
