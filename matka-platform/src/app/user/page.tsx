'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { AnnouncementMarquee } from '@/components/user/AnnouncementMarquee';
import { GameResultCard } from '@/components/user/GameResultCard';
import { useSocketStore } from '@/store/socketStore';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { BannerCarousel } from '@/components/user/BannerCarousel';

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
        const fallbackResults = [
            { id: 1, game_name: 'SRIDEVI', game_color: '#22C55E', open_panna: '388', open_single: '9', close_panna: '280', close_single: '0', jodi: '90', time: '03:45 PM' },
            { id: 2, game_name: 'KALYAN', game_color: '#F97316', open_panna: '147', open_single: '2', close_panna: '560', close_single: '1', jodi: '21', time: '05:15 PM' },
            { id: 3, game_name: 'MILAN DAY', game_color: '#EAB308', open_panna: '236', open_single: '1', close_panna: '', close_single: '', jodi: '', time: '02:00 PM' },
            { id: 4, game_name: 'RAJDHANI', game_color: '#A855F7', open_panna: '579', open_single: '1', close_panna: '348', close_single: '5', jodi: '15', time: '09:30 PM' },
            { id: 5, game_name: 'TIME BAZAR', game_color: '#EF4444', open_panna: '456', open_single: '5', close_panna: '123', close_single: '6', jodi: '56', time: '01:30 PM' },
            { id: 6, game_name: 'MILAN NIGHT', game_color: '#3B82F6', open_panna: '789', open_single: '4', close_panna: '', close_single: '', jodi: '', time: '10:00 PM' },
        ];

        try {
            const res = await api.get<GameResult[]>('/api/results', { filter: 'today' });
            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                setResults(res.data);
            } else {
                setResults(fallbackResults);
            }
        } catch {
            setResults(fallbackResults);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchResults(); }, [fetchResults]);

    // Auto-refresh when new result is declared via WebSocket
    const lastResult = useSocketStore((s) => s.lastResult);
    useSocketEvent(lastResult, () => { fetchResults(); });

    // Live announcement updates
    const lastAnnouncement = useSocketStore((s) => s.lastAnnouncement);
    const [marqueeText, setMarqueeText] = useState('🎉 Welcome to Matka Platform! All games are live. Results updated in real-time. Good luck! 🍀');
    useSocketEvent(lastAnnouncement, (ann) => {
        setMarqueeText(`📢 ${ann.title}: ${ann.message}`);
    });

    return (
        <div className="min-h-screen pb-4">
            {loading ? (
                <div className="space-y-4 animate-pulse px-4 pt-4">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <div className="flex gap-2">
                        <Skeleton className="flex-1 h-10 rounded-xl" />
                        <Skeleton className="flex-1 h-10 rounded-xl" />
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Announcement Marquee - Full Width */}
                    <AnnouncementMarquee text={marqueeText} />

                    {/* Banner Carousel - Full Width */}
                    <div>
                        <BannerCarousel />
                    </div>

                    <div className="px-4 space-y-4 mt-4">

                        {/* Tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTab('matka')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'matka'
                                    ? 'bg-[#003366] text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200'
                                    }`}
                            >
                                MATKA
                            </button>
                            <button
                                onClick={() => setTab('lottery')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'lottery'
                                    ? 'bg-[#003366] text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200'
                                    }`}
                            >
                                LOTTERY MATKA
                            </button>
                        </div>

                        {/* Results Feed */}
                        {/* Results Feed */}
                        {tab === 'matka' ? (
                            <div className="space-y-3">
                                {results.map((r, i) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Link href={`/user/bet?gameId=${r.id}`}>
                                            <GameResultCard
                                                gameName={r.game_name}
                                                gameColor={r.game_color}
                                                openPanna={r.open_panna}
                                                openSingle={r.open_single}
                                                closePanna={r.close_panna}
                                                closeSingle={r.close_single}
                                                jodi={r.jodi}
                                                time={r.time}
                                            />
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
                                <div className="weather-icon mb-4 text-4xl">🎲</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Coming Soon</h3>
                                <p className="text-gray-500 text-center text-sm">
                                    Lottery Matka games are currently under development. Stay tuned for exciting new ways to win!
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* WhatsApp FAB */}
            <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-20 right-4 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:bg-[#128C7E] transition-all z-40 hover:scale-110 active:scale-95"
                style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-white"
                >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            </a>
        </div>
    );
}
