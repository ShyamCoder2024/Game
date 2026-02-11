'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TRANSACTION_LABELS } from '@/lib/constants';

interface LedgerRow {
    id: number;
    date: string;
    type: string;
    amount: number;
    note: string;
    balance_after: number;
}

type TransactionKey = keyof typeof TRANSACTION_LABELS;

export default function LedgerPage() {
    const [data, setData] = useState<LedgerRow[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<LedgerRow[]>('/api/transactions/ledger');
            if (res.success && res.data) setData(res.data);
        } catch {
            setData([
                { id: 1, date: '11 Feb, 10:30 AM', type: 'CREDIT_IN', amount: 5000, note: 'From Master Alpha', balance_after: 30000 },
                { id: 2, date: '11 Feb, 11:00 AM', type: 'BET_PLACED', amount: -500, note: 'KALYAN SA #388', balance_after: 29500 },
                { id: 3, date: '11 Feb, 05:20 PM', type: 'BET_WON', amount: 5000, note: 'KALYAN SA #388 (10x)', balance_after: 34500 },
                { id: 4, date: '10 Feb, 09:00 AM', type: 'CREDIT_IN', amount: 10000, note: 'From Master Alpha', balance_after: 25000 },
                { id: 5, date: '10 Feb, 02:15 PM', type: 'BET_PLACED', amount: -1000, note: 'SRIDEVI JD #90', balance_after: 24000 },
                { id: 6, date: '10 Feb, 03:50 PM', type: 'BET_CANCELLED', amount: 1000, note: 'SRIDEVI JD #90 (cancelled)', balance_after: 25000 },
            ]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const getTypeColor = (type: string) => {
        if (type.includes('WON') || type.includes('CREDIT_IN')) return 'text-green-600';
        if (type.includes('PLACED') || type.includes('DEBIT') || type.includes('WITHDRAWAL')) return 'text-red-600';
        if (type.includes('CANCELLED') || type.includes('ROLLBACK')) return 'text-amber-600';
        return 'text-blue-600';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Link href="/user/profile" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} /></Link>
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-[#059669]" />
                    <h2 className="text-lg font-bold text-gray-800">Ledger</h2>
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
            ) : (
                <div className="space-y-2">
                    {data.map((row) => (
                        <div key={row.id} className="bg-white rounded-xl p-4">
                            <div className="flex items-start justify-between mb-1">
                                <div>
                                    <p className={`text-xs font-bold ${getTypeColor(row.type)}`}>
                                        {TRANSACTION_LABELS[row.type as TransactionKey] || row.type}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-0.5">{row.note}</p>
                                </div>
                                <span className={`text-sm font-bold ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {row.amount >= 0 ? '+' : ''}₹{Math.abs(row.amount).toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">{row.date}</span>
                                <span className="text-xs text-gray-500">₹{row.balance_after.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
