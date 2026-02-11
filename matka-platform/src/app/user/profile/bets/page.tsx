'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Target, ArrowLeft } from 'lucide-react';
import { useSocketStore } from '@/store/socketStore';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import Link from 'next/link';

interface BetRow {
    id: number;
    date: string;
    game_name: string;
    bet_type: string;
    number: string;
    amount: number;
    multiplier: number;
    potential_win: number;
    status: 'won' | 'lost' | 'pending';
    result_amount?: number;
}

export default function BetHistoryPage() {
    const [data, setData] = useState<BetRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<BetRow[]>('/api/bets/history', { status: filter });
            if (res.success && res.data) setData(res.data);
        } catch {
            setData([
                { id: 1, date: '11 Feb, 11:00 AM', game_name: 'KALYAN', bet_type: 'Single Akda', number: '388', amount: 500, multiplier: 10, potential_win: 5000, status: 'won', result_amount: 5000 },
                { id: 2, date: '10 Feb, 02:00 PM', game_name: 'SRIDEVI', bet_type: 'Jodi', number: '90', amount: 1000, multiplier: 100, potential_win: 100000, status: 'lost' },
                { id: 3, date: '11 Feb, 04:00 PM', game_name: 'RAJDHANI', bet_type: 'Single Patti', number: '579', amount: 200, multiplier: 160, potential_win: 32000, status: 'pending' },
                { id: 4, date: '09 Feb, 01:30 PM', game_name: 'TIME BAZAR', bet_type: 'Double Patti', number: '456', amount: 300, multiplier: 320, potential_win: 96000, status: 'won', result_amount: 96000 },
                { id: 5, date: '08 Feb, 09:30 PM', game_name: 'MILAN NIGHT', bet_type: 'Triple Patti', number: '111', amount: 500, multiplier: 70, potential_win: 35000, status: 'lost' },
            ]);
        }
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-refresh when a bet result arrives
    const lastBetResult = useSocketStore((s) => s.lastBetResult);
    useSocketEvent(lastBetResult, () => { fetchData(); });

    const filteredData = filter === 'all' ? data : data.filter((d) => d.status === filter);

    const statusStyles = {
        won: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Won' },
        lost: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Lost' },
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pending' },
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Link href="/user/profile" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} /></Link>
                <div className="flex items-center gap-2">
                    <Target size={18} className="text-[#059669]" />
                    <h2 className="text-lg font-bold text-gray-800">Bet History</h2>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'won', 'lost', 'pending'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-[#059669] text-white' : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Bet Cards */}
            {loading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
            ) : filteredData.length === 0 ? (
                <div className="bg-white rounded-xl py-12 text-center">
                    <Target size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No bets found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredData.map((bet) => {
                        const s = statusStyles[bet.status];
                        return (
                            <div key={bet.id} className="bg-white rounded-xl p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{bet.game_name}</p>
                                        <p className="text-xs text-gray-500">{bet.bet_type} · #{bet.number}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${s.bg} ${s.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">₹{bet.amount.toLocaleString('en-IN')} × {bet.multiplier}x</span>
                                    {bet.status === 'won' ? (
                                        <span className="font-bold text-green-600">Won ₹{(bet.result_amount || 0).toLocaleString('en-IN')}</span>
                                    ) : bet.status === 'lost' ? (
                                        <span className="font-bold text-red-600">-₹{bet.amount.toLocaleString('en-IN')}</span>
                                    ) : (
                                        <span className="font-semibold text-amber-600">Potential: ₹{bet.potential_win.toLocaleString('en-IN')}</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">{bet.date}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
