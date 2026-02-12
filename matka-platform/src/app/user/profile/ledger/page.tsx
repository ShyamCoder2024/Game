'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { TRANSACTION_LABELS } from '@/lib/constants';

interface Transaction {
    id: number;
    amount: number;
    type: string;
    note: string;
    date: string;
    balance_after: number;
}

const getTypeColor = (type: string) => {
    if (['CREDIT_IN', 'BET_WON', 'ROLLBACK_DEBIT', 'LOAN_IN'].includes(type)) return 'text-green-600';
    if (['CREDIT_OUT', 'BET_PLACED', 'WITHDRAWAL', 'LOAN_REPAYMENT'].includes(type)) return 'text-red-600';
    return 'text-slate-700';
};

export default function UserLedgerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Transaction[]>([]);

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const res = await api.get<Transaction[]>('/api/user/ledger');
                if (res.success && res.data) {
                    setData(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch ledger', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, []);

    return (
        <div className="container mx-auto p-4 max-w-lg mb-24">
            <div className="flex items-center gap-2 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Ledger</h1>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            ) : data.length === 0 ? (
                <div className="bg-white rounded-xl py-12 text-center">
                    <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No transactions found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {data.map((row) => (
                        <div key={row.id} className="bg-white rounded-xl p-4 shadow-sm border border-transparent hover:border-slate-200 transition-colors">
                            <div className="flex items-start justify-between mb-1">
                                <div>
                                    <p className={`text-xs font-bold ${getTypeColor(row.type)}`}>
                                        {TRANSACTION_LABELS[row.type as keyof typeof TRANSACTION_LABELS] || row.type}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-0.5">{row.note}</p>
                                </div>
                                <span className={`text-sm font-bold ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {row.amount >= 0 ? '+' : ''}₹{Math.abs(row.amount).toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                                <span className="text-[10px] text-gray-400">{new Date(row.date).toLocaleString()}</span>
                                <span className="text-xs text-gray-500 font-medium">Bal: ₹{row.balance_after.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
