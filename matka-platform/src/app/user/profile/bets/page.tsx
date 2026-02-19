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
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock, label: 'Running' },
    won: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2, label: 'Won' },
    lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Lost' },
};

const getSessionLabel = (betType: string) => {
    // This logic might need adjustment based on actual data if session is stored differently
    // Assuming 'Open' or 'Close' might be part of the bet type or derived
    // For now, mapping known types or using a default if not present
    if (betType.toLowerCase().includes('open')) return 'OPEN';
    if (betType.toLowerCase().includes('close')) return 'CLOSE';
    return 'OPEN'; // Default to OPEN if not specified, or handle logic based on time/game
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
                            // Extract session from bet type or default (customize based on actual API data)
                            const session = bet.bet_type.toLowerCase().includes('close') ? 'CLOSE' : 'OPEN';
                            const displayType = bet.bet_type.replace(/_/g, ' ').replace('open', '').replace('close', '').trim() || bet.bet_type;

                            return (
                                <div key={bet.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Header: Game Name & Date */}
                                    <div className="bg-gray-50/50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-6 rounded-full bg-[#003366]" />
                                            <div>
                                                <h3 className="text-sm font-black text-gray-800 tracking-tight leading-none uppercase">
                                                    {bet.game_name}
                                                </h3>
                                                <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                                                    {new Date(bet.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} • {new Date(bet.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.border} ${config.text}`}>
                                            <StatusIcon size={12} strokeWidth={3} />
                                            <span className="text-[10px] font-bold uppercase tracking-wide">{config.label}</span>
                                        </div>
                                    </div>

                                    {/* Body: Bet Details Grid */}
                                    <div className="p-4">
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                            {/* Session */}
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Session</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${session === 'OPEN' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                                    {session}
                                                </span>
                                            </div>

                                            {/* Bet Type */}
                                            <div className="text-right">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Bet Type</span>
                                                <span className="text-xs font-bold text-gray-700 uppercase">
                                                    {displayType}
                                                </span>
                                            </div>

                                            {/* Number/Panna */}
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Selection</span>
                                                <span className="text-base font-black text-slate-800 font-mono bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 inline-block">
                                                    {bet.number}
                                                </span>
                                            </div>

                                            {/* Points/Amount */}
                                            <div className="text-right">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Points</span>
                                                <span className="text-base font-black text-[#003366]">
                                                    {bet.amount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer: Financial/Status */}
                                    <div className={`px-4 py-3 flex items-center justify-between border-t ${bet.status === 'won' ? 'bg-green-50/30 border-green-100' : bet.status === 'lost' ? 'bg-red-50/30 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                            {bet.status === 'pending' ? 'Potential Win' : bet.status === 'won' ? 'You Won' : 'Result'}
                                        </div>
                                        <div className={`text-sm font-black ${bet.status === 'won' ? 'text-green-600' : bet.status === 'lost' ? 'text-red-500' : 'text-gray-800'}`}>
                                            {bet.status === 'won'
                                                ? `+₹${(bet.result_amount || 0).toLocaleString('en-IN')}`
                                                : bet.status === 'lost'
                                                    ? 'Better Luck Next Time'
                                                    : `₹${bet.potential_win.toLocaleString('en-IN')}`
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
