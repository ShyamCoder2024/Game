'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Bet {
    id: number;
    bet_id: string;
    game: {
        name: string;
        color_code: string;
    };
    bet_type: string;
    bet_number: string;
    bet_amount: number;
    status: 'pending' | 'won' | 'lost';
    payout_multiplier: number;
    win_amount: number;
    potential_win: number;
    session: 'OPEN' | 'CLOSE';
    date: string;
    created_at: string;
}

const statusConfig = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock, label: 'Running' },
    won: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2, label: 'Won' },
    lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Lost' },
};

const formatBetType = (type: string) => {
    return type.replace(/_/g, ' ').toUpperCase();
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
                            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
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
                    <div className="space-y-4">
                        {data.map((bet) => {
                            const config = statusConfig[bet.status] || statusConfig.pending;
                            const StatusIcon = config.icon;
                            const displayType = formatBetType(bet.bet_type);
                            const gameName = bet.game?.name || 'UNKNOWN GAME';
                            const gameColor = bet.game?.color_code || '#003366';
                            const betDate = bet.created_at || bet.date;

                            return (
                                <div key={bet.id} className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                                    {/* Header: Game Name & Date */}
                                    <div className="bg-gray-50/80 px-4 py-3 flex items-center justify-between border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: gameColor }} />
                                            <div>
                                                <h3 className="text-sm font-black text-gray-800 tracking-tight leading-none uppercase">
                                                    {gameName}
                                                </h3>
                                                <span className="text-[10px] font-bold text-gray-400 tracking-wider mt-1 block">
                                                    {new Date(betDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} • {new Date(betDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm ${config.bg} ${config.border} ${config.text}`}>
                                            <StatusIcon size={12} strokeWidth={3} />
                                            <span className="text-[10px] font-bold uppercase tracking-wide">{config.label}</span>
                                        </div>
                                    </div>

                                    {/* Body: Bet Details Grid */}
                                    <div className="p-4 bg-white">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Session</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block uppercase tracking-wider ${bet.session === 'OPEN' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                                    {bet.session || 'OPEN'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Bet Type</span>
                                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">
                                                    {displayType}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Selection</span>
                                                <span className="text-lg font-black text-slate-800 font-mono tracking-widest">
                                                    {bet.bet_number}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Coins</span>
                                                <span className="text-lg font-black text-[#003366]">
                                                    ₹{bet.bet_amount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer: Financial/Status */}
                                    <div className={`px-4 py-3 flex items-center justify-between border-t transition-colors ${bet.status === 'won' ? 'bg-green-50/60 border-green-100' : bet.status === 'lost' ? 'bg-red-50/60 border-red-100' : 'bg-blue-50/30 border-blue-50'}`}>
                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${bet.status === 'won' ? 'text-green-700' : bet.status === 'lost' ? 'text-red-700' : 'text-blue-700'}`}>
                                            {bet.status === 'pending' ? 'Potential Win' : bet.status === 'won' ? 'You Won' : 'Result'}
                                        </div>
                                        <div className={`text-base font-black tracking-tight ${bet.status === 'won' ? 'text-green-600' : bet.status === 'lost' ? 'text-red-500' : 'text-blue-600'}`}>
                                            {bet.status === 'won'
                                                ? `+₹${(bet.win_amount || 0).toLocaleString('en-IN')}`
                                                : bet.status === 'lost'
                                                    ? 'Better Luck Next Time'
                                                    : `₹${(bet.potential_win || 0).toLocaleString('en-IN')}`
                                            }
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
