'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { AnnouncementMarquee } from '@/components/user/AnnouncementMarquee';
import { GameResultCard } from '@/components/user/GameResultCard';
import { MessageCircle } from 'lucide-react';

interface GameResult {
    id: number;
    game_name: string;
    game_color: string;
    open_panna: string;
    open_single: string;
    close_panna: string;
    close_single: string;
    jodi: string;
    time: string;
}

export default function UserHomePage() {
    const [results, setResults] = useState<GameResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'matka' | 'lottery'>('matka');

    const fetchResults = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<GameResult[]>('/api/results', { filter: 'today' });
            if (res.success && res.data) setResults(res.data);
        } catch {
            setResults([
                { id: 1, game_name: 'SRIDEVI', game_color: '#22C55E', open_panna: '388', open_single: '9', close_panna: '280', close_single: '0', jodi: '90', time: '03:45 PM' },
                { id: 2, game_name: 'KALYAN', game_color: '#F97316', open_panna: '147', open_single: '2', close_panna: '560', close_single: '1', jodi: '21', time: '05:15 PM' },
                { id: 3, game_name: 'MILAN DAY', game_color: '#EAB308', open_panna: '236', open_single: '1', close_panna: '', close_single: '', jodi: '', time: '02:00 PM' },
                { id: 4, game_name: 'RAJDHANI', game_color: '#A855F7', open_panna: '579', open_single: '1', close_panna: '348', close_single: '5', jodi: '15', time: '09:30 PM' },
                { id: 5, game_name: 'TIME BAZAR', game_color: '#EF4444', open_panna: '456', open_single: '5', close_panna: '123', close_single: '6', jodi: '56', time: '01:30 PM' },
                { id: 6, game_name: 'MILAN NIGHT', game_color: '#3B82F6', open_panna: '789', open_single: '4', close_panna: '', close_single: '', jodi: '', time: '10:00 PM' },
            ]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchResults(); }, [fetchResults]);

    return (
        <div className="space-y-4">
            {/* Announcement Marquee */}
            <AnnouncementMarquee text="🎉 Welcome to Matka Platform! All games are live. Results updated in real-time. Good luck! 🍀" />

            {/* Banner */}
            <div className="relative h-32 rounded-2xl bg-gradient-to-r from-[#059669] to-[#047857] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                        <h2 className="text-xl font-bold mb-1">🎯 Play & Win Big</h2>
                        <p className="text-sm text-white/80">Today&apos;s results are live!</p>
                    </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setTab('matka')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'matka'
                            ? 'bg-[#059669] text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                >
                    MATKA
                </button>
                <button
                    disabled
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                >
                    LOTTERY MATKA
                </button>
            </div>

            {/* Results Feed */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {results.map((r) => (
                        <GameResultCard
                            key={r.id}
                            gameName={r.game_name}
                            gameColor={r.game_color}
                            openPanna={r.open_panna}
                            openSingle={r.open_single}
                            closePanna={r.close_panna}
                            closeSingle={r.close_single}
                            jodi={r.jodi}
                            time={r.time}
                        />
                    ))}
                </div>
            )}

            {/* WhatsApp FAB */}
            <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-20 right-4 w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1EB354] transition-colors z-40"
                style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <MessageCircle size={22} className="text-white" />
            </a>
        </div>
    );
}
