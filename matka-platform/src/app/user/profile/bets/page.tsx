'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Bet {
    id: number;
    game_name: string;
    bet_type: string;
    number: string;
    amount: number;
    status: 'pending' | 'won' | 'lost';
    multiplier: number;
    result_amount?: number;
    potential_win: number;
    date: string;
}

const statusStyles = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending' },
    won: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Won' },
    lost: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Lost' },
};

export default function UserBetsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Bet[]>([]);

    useEffect(() => {
        const fetchBets = async () => {
            try {
                const res = await api.get<Bet[]>('/api/bets/my-bets');
                if (res.success && res.data) {
                    setData(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch bets', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBets();
    }, []);

    // For now we just display all bets, preventing "filteredData" error
    const filteredData = data;

    return (
        <div className="container mx-auto p-4 max-w-lg mb-24">
            <div className="flex items-center gap-2 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800">My Bets</h1>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            ) : filteredData.length === 0 ? (
                <div className="bg-white rounded-xl py-12 text-center">
                    <Target size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No bets found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredData.map((bet) => {
                        const s = statusStyles[bet.status] || statusStyles.pending;
                        return (
                            <div key={bet.id} className="bg-white rounded-xl p-4 shadow-sm border border-transparent hover:border-slate-200 transition-colors">
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
                                <p className="text-[10px] text-gray-400 mt-1">{new Date(bet.date).toLocaleString()}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
