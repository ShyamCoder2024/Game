/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface StatementItem {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    balance: number;
}

export default function UserStatementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<StatementItem[]>([]);

    useEffect(() => {
        const fetchStatement = async () => {
            try {
                const res = await api.get<any>('/api/user/ledger');
                if (res.success && res.data) {
                    const formattedData = res.data.map((item: any) => ({
                        id: item.id,
                        date: new Date(item.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        description: item.note,
                        amount: Math.abs(item.amount),
                        type: item.amount >= 0 ? 'credit' : 'debit',
                        balance: item.balance_after
                    }));
                    setData(formattedData);
                }
            } catch (error) {
                console.error('Failed to fetch statement', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStatement();
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
                        <h1 className="text-lg font-bold tracking-wide">Account Statement</h1>
                        <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">
                            Financial Activity
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
                            <FileText size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-gray-800 font-bold mb-1">No Statements Found</h3>
                        <p className="text-gray-400 text-xs">Your financial activity will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.map((row) => (
                            <div key={row.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden group">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${row.type === 'credit' ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${row.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {row.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{row.description}</p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{row.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-black block ${row.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {row.type === 'credit' ? '+' : '-'}₹{row.amount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Closing Balance</span>
                                    <span className="text-xs font-bold text-[#003366]">₹{row.balance.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
