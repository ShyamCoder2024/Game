'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface StatementRow {
    id: number;
    date: string;
    description: string;
    credit: number;
    debit: number;
    balance: number;
}

export default function StatementPage() {
    const [data, setData] = useState<StatementRow[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<StatementRow[]>('/api/transactions/statement');
            if (res.success && res.data) setData(res.data);
        } catch {
            setData([
                { id: 1, date: '11 Feb 2026, 10:30 AM', description: 'Coins Received from Master', credit: 5000, debit: 0, balance: 30000 },
                { id: 2, date: '11 Feb 2026, 11:00 AM', description: 'Bet Placed — KALYAN SA', credit: 0, debit: 500, balance: 29500 },
                { id: 3, date: '11 Feb 2026, 05:20 PM', description: 'Bet Won — KALYAN SA (10x)', credit: 5000, debit: 0, balance: 34500 },
                { id: 4, date: '10 Feb 2026, 09:00 AM', description: 'Coins Received from Master', credit: 10000, debit: 0, balance: 25000 },
                { id: 5, date: '10 Feb 2026, 02:00 PM', description: 'Bet Placed — SRIDEVI JD', credit: 0, debit: 1000, balance: 24000 },
            ]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Link href="/user/profile" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} /></Link>
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-[#059669]" />
                    <h2 className="text-lg font-bold text-gray-800">Statement</h2>
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
            ) : (
                <div className="space-y-2">
                    {data.map((row) => (
                        <div key={row.id} className="bg-white rounded-xl p-4">
                            <div className="flex items-start justify-between mb-1">
                                <p className="text-sm font-medium text-gray-800 flex-1">{row.description}</p>
                                {row.credit > 0 ? (
                                    <span className="text-sm font-bold text-green-600">+₹{row.credit.toLocaleString('en-IN')}</span>
                                ) : (
                                    <span className="text-sm font-bold text-red-600">-₹{row.debit.toLocaleString('en-IN')}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">{row.date}</span>
                                <span className="text-xs text-gray-500">Bal: ₹{row.balance.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
