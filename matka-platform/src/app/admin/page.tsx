'use client';

// src/app/admin/page.tsx
// Admin Dashboard — stat cards, P/L chart, recent bets, upcoming results

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { PnlChart } from '@/components/dashboard/PnlChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatIndianCurrency } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import { useSocketStore } from '@/store/socketStore';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import {
    DollarSign,
    BarChart3,
    TrendingUp,
    Users,
    Clock,
    Gamepad2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
    totalBetsToday: number;
    totalVolumeToday: number;
    netPnlToday: number;
    activeUsers: number;
    totalBetsTrend: number;
    volumeTrend: number;
    pnlTrend: number;
    usersTrend: number;
}

interface RecentBet {
    bet_id: string;
    user_id: string;
    game_name: string;
    bet_type: string;
    bet_amount: number;
    status: string;
    created_at: string;
}

interface UpcomingResult {
    game_id: number;
    game_name: string;
    session: string;
    close_time: string;
    status: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pnlData, setPnlData] = useState<{ date: string; pnl: number }[]>([]);
    const [recentBets, setRecentBets] = useState<RecentBet[]>([]);
    const [upcoming, setUpcoming] = useState<UpcomingResult[]>([]);
    const [loading, setLoading] = useState(true);

    // WebSocket — real-time updates
    const { isConnected } = useSocket();
    const lastDashboardStats = useSocketStore((s) => s.lastDashboardStats);
    const lastBetStream = useSocketStore((s) => s.lastBetStream);

    // Live stat cards update
    useSocketEvent(lastDashboardStats, (data) => {
        setStats((prev) => prev ? { ...prev, ...data } : { ...data, totalBetsTrend: 0, volumeTrend: 0, pnlTrend: 0, usersTrend: 0 });
    });

    // Live bet stream — prepend new bet
    useSocketEvent(lastBetStream, (bet) => {
        setRecentBets((prev) => [bet, ...prev].slice(0, 20));
    });

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            // Fetch all dashboard data in parallel
            const [statsRes, pnlRes, betsRes, upcomingRes] = await Promise.allSettled([
                api.get<DashboardStats>('/api/admin/dashboard/stats'),
                api.get<{ date: string; pnl: number }[]>('/api/admin/dashboard/pnl-chart'),
                api.get<RecentBet[]>('/api/admin/dashboard/live-bets'),
                api.get<UpcomingResult[]>('/api/admin/dashboard/upcoming'),
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value.data) {
                setStats(statsRes.value.data);
            }
            if (pnlRes.status === 'fulfilled' && pnlRes.value.data) {
                setPnlData(pnlRes.value.data);
            }
            if (betsRes.status === 'fulfilled' && betsRes.value.data) {
                setRecentBets(betsRes.value.data);
            }
            if (upcomingRes.status === 'fulfilled' && upcomingRes.value.data) {
                setUpcoming(upcomingRes.value.data);
            }
        } catch {
            // Dashboard gracefully handles missing data
        } finally {
            setLoading(false);
        }
    };

    // Placeholder data when APIs aren't available yet
    const displayStats = stats || {
        totalBetsToday: 0,
        totalVolumeToday: 0,
        netPnlToday: 0,
        activeUsers: 0,
        totalBetsTrend: 0,
        volumeTrend: 0,
        pnlTrend: 0,
        usersTrend: 0,
    };

    const placeholderPnl = pnlData.length > 0
        ? pnlData
        : [
            { date: 'Mon', pnl: 12000 },
            { date: 'Tue', pnl: -5000 },
            { date: 'Wed', pnl: 18000 },
            { date: 'Thu', pnl: 8000 },
            { date: 'Fri', pnl: -3000 },
            { date: 'Sat', pnl: 25000 },
            { date: 'Sun', pnl: 15000 },
        ];

    return (
        <div className="space-y-6">
            {/* Page title + Live indicator */}
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Overview of today&apos;s activity and performance
                    </p>
                </div>
                {isConnected && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live
                    </span>
                )}
            </div>

            {/* Stat cards - 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="border-0 shadow-md">
                            <CardContent className="p-5">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-32 mb-2" />
                                <Skeleton className="h-3 w-20" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <>
                        <StatCard
                            title="Total Bets Today"
                            value={displayStats.totalBetsToday}
                            trend={displayStats.totalBetsTrend}
                            icon={BarChart3}
                            iconColor="text-blue-600"
                            iconBg="bg-blue-100"
                        />
                        <StatCard
                            title="Total Volume"
                            value={displayStats.totalVolumeToday}
                            isCurrency
                            trend={displayStats.volumeTrend}
                            icon={DollarSign}
                            iconColor="text-emerald-600"
                            iconBg="bg-emerald-100"
                        />
                        <StatCard
                            title="Net P/L Today"
                            value={displayStats.netPnlToday}
                            isCurrency
                            trend={displayStats.pnlTrend}
                            icon={TrendingUp}
                            iconColor="text-purple-600"
                            iconBg="bg-purple-100"
                        />
                        <StatCard
                            title="Active Users"
                            value={displayStats.activeUsers}
                            trend={displayStats.usersTrend}
                            icon={Users}
                            iconColor="text-amber-600"
                            iconBg="bg-amber-100"
                        />
                    </>
                )}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* P/L Chart - 2 columns */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <Skeleton className="h-[350px] w-full rounded-xl" />
                    ) : (
                        <PnlChart data={placeholderPnl} loading={loading} />
                    )}
                </div>

                {/* Upcoming results */}
                {loading ? (
                    <Card className="border-0 shadow-md h-full">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="flex gap-2">
                                            <Skeleton className="h-4 w-4" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                <Clock size={16} className="text-amber-500" />
                                Upcoming Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {upcoming.length > 0 ? (
                                <div className="space-y-3">
                                    {upcoming.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Gamepad2 size={14} className="text-slate-400" />
                                                <span className="text-sm font-medium text-slate-700">
                                                    {item.game_name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {item.session}
                                                </Badge>
                                                <span className="text-xs text-slate-500">{item.close_time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[240px] flex flex-col items-center justify-center text-slate-400">
                                    <Clock size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">No upcoming results</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Recent bets table */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-700">
                        Recent Bets
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase">
                                        Bet ID
                                    </th>
                                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase">
                                        User
                                    </th>
                                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase">
                                        Game
                                    </th>
                                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase">
                                        Type
                                    </th>
                                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 uppercase">
                                        Amount
                                    </th>
                                    <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            <td className="py-3 px-3"><Skeleton className="h-4 w-16" /></td>
                                            <td className="py-3 px-3"><Skeleton className="h-4 w-20" /></td>
                                            <td className="py-3 px-3"><Skeleton className="h-4 w-24" /></td>
                                            <td className="py-3 px-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                            <td className="py-3 px-3"><div className="flex justify-end"><Skeleton className="h-4 w-12" /></div></td>
                                            <td className="py-3 px-3"><div className="flex justify-center"><Skeleton className="h-5 w-16 rounded-full" /></div></td>
                                        </tr>
                                    ))
                                ) : recentBets.length > 0 ? (
                                    recentBets.map((bet) => (
                                        <tr
                                            key={bet.bet_id}
                                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="py-3 px-3 font-mono text-xs text-slate-600">
                                                {bet.bet_id}
                                            </td>
                                            <td className="py-3 px-3 font-medium text-slate-700">
                                                {bet.user_id}
                                            </td>
                                            <td className="py-3 px-3 text-slate-600">
                                                {bet.game_name}
                                            </td>
                                            <td className="py-3 px-3">
                                                <Badge variant="outline" className="text-xs">
                                                    {bet.bet_type}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-3 text-right font-semibold text-slate-700">
                                                {formatIndianCurrency(bet.bet_amount)}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span
                                                    className={
                                                        bet.status === 'won'
                                                            ? 'badge-won'
                                                            : bet.status === 'lost'
                                                                ? 'badge-lost'
                                                                : 'badge-pending'
                                                    }
                                                >
                                                    {bet.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
                                            No recent bets to display
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
