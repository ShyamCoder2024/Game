'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ArrowLeft, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { TRANSACTION_LABELS } from '@/lib/constants';

interface Transaction {
    id: number;
    amount: number;
    type: string;
    note: string;
    created_at: string;
    date: string;
    balance_after: number;
}

const getTypeColor = (type: string) => {
    if (['CREDIT_IN', 'BET_WON', 'ROLLBACK_DEBIT', 'LOAN_IN'].includes(type)) return 'text-green-600 bg-green-50 border-green-100';
    if (['CREDIT_OUT', 'BET_PLACED', 'WITHDRAWAL', 'LOAN_REPAYMENT'].includes(type)) return 'text-red-600 bg-red-50 border-red-100';
    return 'text-gray-600 bg-gray-50 border-gray-100';
};

const getIcon = (amount: number) => {
    return amount >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Premium Header */}
            <div className="sticky top-0 z-30 bg-[#003366] text-white shadow-lg">
                <div className="flex items-center gap-4 px-4 py-4 max-w-lg mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold tracking-wide">Ledger Logs</h1>
                        <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">
                            Detailed Transaction History
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <BookOpen size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-gray-800 font-bold mb-1">No Transactions Found</h3>
                        <p className="text-gray-400 text-xs">Your detailed ledger will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.map((row) => {
                            const isCredit = row.amount >= 0;
                            const timestamp = row.created_at || row.date;
                            const colorClass = getTypeColor(row.type);

                            return (
                                <div key={row.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group transition-all hover:shadow-md">
                                    {/* Left Accent Bar */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCredit ? 'bg-green-500' : 'bg-red-500'}`} />

                                    <div className="p-4 pl-5">
                                        <div className="flex justify-between items-start mb-3">
                                            {/* Transaction Type & Date */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${colorClass}`}>
                                                        {TRANSACTION_LABELS[row.type as keyof typeof TRANSACTION_LABELS] || row.type.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                                    {row.note}
                                                </p>
                                                <span className="text-[10px] text-gray-400 font-medium mt-1 inline-block">
                                                    {new Date(timestamp).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Amount Details */}
                                            <div className="text-right flex flex-col items-end">
                                                <div className={`flex items-center gap-1 font-black text-lg ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                                                    {isCredit ? '+' : ''}₹{Math.abs(row.amount).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Closing Balance Footer */}
                                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-50">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                Closing Balance
                                            </span>
                                            <span className="text-sm font-black text-[#003366] font-mono bg-[#003366]/5 px-2 py-0.5 rounded">
                                                ₹{row.balance_after.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
