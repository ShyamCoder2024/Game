'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
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
    if (['CREDIT_IN', 'BET_WON', 'ROLLBACK_DEBIT', 'LOAN_IN'].includes(type)) return 'bg-green-50 text-green-600';
    if (['CREDIT_OUT', 'BET_PLACED', 'WITHDRAWAL', 'LOAN_REPAYMENT'].includes(type)) return 'bg-red-50 text-red-600';
    return 'bg-gray-50 text-gray-600';
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
                        <h1 className="text-lg font-bold tracking-wide">Ledger</h1>
                        <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">
                            Detailed Transactions
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
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
                        {data.map((row) => (
                            <div key={row.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden group">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${getTypeColor(row.type)}`}>
                                            {row.amount >= 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                {TRANSACTION_LABELS[row.type as keyof typeof TRANSACTION_LABELS] || row.type}
                                            </p>
                                            <p className="text-sm font-bold text-gray-800 mt-0.5">{row.note}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-black block ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {row.amount >= 0 ? '+' : ''}₹{Math.abs(row.amount).toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-[10px] text-gray-400 block mt-1">{new Date(row.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                                    <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Closing Balance</span>
                                    <span className="text-xs font-bold text-[#003366]">₹{row.balance_after.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
