'use client';

// src/components/leaders/CoinTransferDialog.tsx
// Credit/debit coins dialog

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface CoinTransferDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: number;
    userName: string;
    type: 'credit' | 'debit';
}

export function CoinTransferDialog({
    open,
    onClose,
    onSuccess,
    userId,
    userName,
    type,
}: CoinTransferDialogProps) {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isCredit = type === 'credit';
    const Icon = isCredit ? ArrowUpCircle : ArrowDownCircle;
    const color = isCredit ? 'green' : 'red';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isCredit ? '/api/wallet/credit' : '/api/wallet/debit';
            const res = await api.post(endpoint, {
                user_id: userId,
                amount: Number(amount),
                note,
            });

            if (!res.success) {
                setError(res.error?.message || `Failed to ${type} coins`);
                return;
            }

            setAmount('');
            setNote('');
            onSuccess();
            onClose();
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fade-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center`}>
                        <Icon size={20} className={`text-${color}-600`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            {isCredit ? 'Credit' : 'Debit'} Coins
                        </h3>
                        <p className="text-xs text-slate-500">
                            {isCredit ? 'Add' : 'Withdraw'} coins for {userName} ({userId})
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-700">Amount (₹)</Label>
                        <Input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="bg-slate-50 text-lg font-semibold"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700">Note (optional)</Label>
                        <Input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Weekly deposit"
                            className="bg-slate-50"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className={`flex-1 ${isCredit
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                                } text-white`}
                            disabled={loading}
                        >
                            {loading
                                ? 'Processing...'
                                : `${isCredit ? 'Credit' : 'Debit'} Coins`}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
