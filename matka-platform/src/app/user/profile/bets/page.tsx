'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
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

const statusConfig = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: Clock, label: 'Running' },
    won: { bg: 'bg-green-50', text: 'text-green-600', icon: CheckCircle2, label: 'Won' },
    lost: { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle, label: 'Lost' },
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
                        <h1 className="text-lg font-bold tracking-wide">My Bets</h1>
                        <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">
                            Betting History
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Target size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-gray-800 font-bold mb-1">No Bets Found</h3>
                        <p className="text-gray-400 text-xs">Start betting to see your history here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.map((bet) => {
                            const config = statusConfig[bet.status] || statusConfig.pending;
                            const StatusIcon = config.icon;

                            return (
                                <div key={bet.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden group">
                                    {/* Game Header */}
                                    <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-4 rounded-full bg-[#003366]" />
                                            <span className="text-sm font-black text-gray-800 tracking-tight">
                                                {bet.game_name}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${config.bg} ${config.text}`}>
                                            <StatusIcon size={12} strokeWidth={3} />
                                            {config.label}
                                        </div>
                                    </div>

                                    {/* Bet Details */}
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block mb-0.5">Bet Type</span>
                                            <span className="text-sm font-bold text-gray-700">{bet.bet_type}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block mb-0.5">Number</span>
                                            <span className="text-sm font-black text-[#003366] bg-blue-50 px-2 py-0.5 rounded-md">
                                                {bet.number}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Financials */}
                                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-bold block">Invested</span>
                                            <span className="text-sm font-bold text-gray-800">₹{bet.amount.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="text-right">
                                            {bet.status === 'won' ? (
                                                <>
                                                    <span className="text-[10px] text-green-500 font-bold block">Winnings</span>
                                                    <span className="text-sm font-black text-green-600">
                                                        +₹{(bet.result_amount || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </>
                                            ) : bet.status === 'lost' ? (
                                                <>
                                                    <span className="text-[10px] text-red-500 font-bold block">Outcome</span>
                                                    <span className="text-sm font-bold text-red-600">Lost</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-[10px] text-amber-500 font-bold block">Potential Win</span>
                                                    <span className="text-sm font-bold text-amber-600">
                                                        ₹{bet.potential_win.toLocaleString('en-IN')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2 text-right">
                                        <span className="text-[9px] text-gray-300 font-medium">Placed: {new Date(bet.date).toLocaleString()}</span>
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
