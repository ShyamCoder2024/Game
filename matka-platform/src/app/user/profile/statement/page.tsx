'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowLeft } from 'lucide-react';
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
                // Using ledger endpoint but mapping to statement view since statement endpoint might be summary
                const res = await api.get<any>('/api/user/ledger');
                if (res.success && res.data) {
                    // Start from balance and reconstruct statement view if needed
                    // For now, let's assume we want to show the same transactions but maybe formatted differently
                    // Or if statement endpoint exists and returns list, use that.

                    // Actually, let's check if there is a specific statement endpoint that returns a list.
                    // If not, we might be reusing ledger data.
                    // The corrupted file used fields: credit, debit, balance, description. 

                    const formattedData = res.data.map((item: any) => ({
                        id: item.id,
                        date: new Date(item.date).toLocaleDateString(),
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
        <div className="container mx-auto p-4 max-w-lg mb-24">
            <div className="flex items-center gap-2 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Account Statement</h1>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            ) : data.length === 0 ? (
                <div className="bg-white rounded-xl py-12 text-center">
                    <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No statements found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {data.map((row) => (
                        <div key={row.id} className="bg-white rounded-xl p-4 shadow-sm border border-transparent hover:border-slate-200 transition-colors">
                            <div className="flex items-start justify-between mb-1">
                                <p className="text-sm font-medium text-gray-800 flex-1">{row.description}</p>
                                <span className={`text-sm font-bold ${row.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {row.type === 'credit' ? '+' : '-'}₹{row.amount.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                                <span className="text-[10px] text-gray-400">{row.date}</span>
                                <span className="text-xs text-gray-500 font-medium">Bal: ₹{row.balance.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
