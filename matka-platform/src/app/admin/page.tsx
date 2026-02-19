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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page title + Live indicator */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Overview</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        Real-time snapshot of today&apos;s activity
                    </p>
                </div>
                {isConnected && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-green-100 rounded-full shadow-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Live Updates</span>
                    </div>
                )}
            </div>

            {/* Stat cards - 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="border-0 shadow-sm bg-white/50">
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-24 mb-3" />
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
                            iconBg="bg-blue-50"
                        />
                        <StatCard
                            title="Total Volume"
                            value={displayStats.totalVolumeToday}
                            isCurrency
                            trend={displayStats.volumeTrend}
                            icon={DollarSign}
                            iconColor="text-emerald-600"
                            iconBg="bg-emerald-50"
                        />
                        <StatCard
                            title="Net P/L Today"
                            value={displayStats.netPnlToday}
                            isCurrency
                            trend={displayStats.pnlTrend}
                            icon={TrendingUp}
                            iconColor="text-purple-600"
                            iconBg="bg-purple-50"
                        />
                        <StatCard
                            title="Active Users"
                            value={displayStats.activeUsers}
                            trend={displayStats.usersTrend}
                            icon={Users}
                            iconColor="text-amber-600"
                            iconBg="bg-amber-50"
                        />
                    </>
                )}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* P/L Chart - 2 columns */}
                <div className="lg:col-span-2 flex flex-col">
                    {loading ? (
                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                    ) : (
                        <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 h-full">
                            <PnlChart data={placeholderPnl} loading={loading} />
                        </div>
                    )}
                </div>

                {/* Upcoming results - Fixed height with scroll */}
                {loading ? (
                    <Card className="border-0 shadow-sm h-[400px] rounded-2xl">
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
                    <Card className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow h-[400px] flex flex-col">
                        <CardHeader className="pb-3 border-b border-slate-50 shrink-0">
                            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                                <Clock size={16} className="text-amber-500" />
                                Upcoming Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pr-2">
                            {upcoming.length > 0 ? (
                                <div className="space-y-3">
                                    {upcoming.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group shrink-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-amber-500 transition-colors">
                                                    <Gamepad2 size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                                                        {item.game_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">Session: {item.session}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] font-bold bg-white border-slate-200 text-slate-600 px-1.5 py-0 mb-0.5"
                                                >
                                                    {item.close_time}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                                        <Clock size={24} className="opacity-50" />
                                    </div>
                                    <p className="text-sm font-medium">No upcoming results</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Recent bets table */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                        Recent Live Bets
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Bet ID
                                    </th>
                                    <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Game
                                    </th>
                                    <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="text-right py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="text-center py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-50">
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-16" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                            <td className="py-4 px-6"><div className="flex justify-end"><Skeleton className="h-4 w-12" /></div></td>
                                            <td className="py-4 px-6"><div className="flex justify-center"><Skeleton className="h-5 w-16 rounded-full" /></div></td>
                                        </tr>
                                    ))
                                ) : recentBets.length > 0 ? (
                                    recentBets.map((bet) => (
                                        <tr
                                            key={bet.bet_id}
                                            className="group border-b border-slate-50 hover:bg-blue-50/30 transition-colors"
                                        >
                                            <td className="py-3.5 px-6 font-mono text-[11px] font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
                                                {bet.bet_id}
                                            </td>
                                            <td className="py-3.5 px-6 font-semibold text-slate-700">
                                                {bet.user_id}
                                            </td>
                                            <td className="py-3.5 px-6 text-slate-600 font-medium text-xs">
                                                {bet.game_name}
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide bg-white text-slate-500 border-slate-200">
                                                    {bet.bet_type}
                                                </Badge>
                                            </td>
                                            <td className="py-3.5 px-6 text-right font-bold text-slate-700 font-mono">
                                                {formatIndianCurrency(bet.bet_amount)}
                                            </td>
                                            <td className="py-3.5 px-6 text-center">
                                                <span
                                                    className={`
                                                        inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border
                                                        ${bet.status === 'won'
                                                            ? 'bg-green-50 text-green-700 border-green-100'
                                                            : bet.status === 'lost'
                                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                                : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                        }
                                                    `}
                                                >
                                                    {bet.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                                    <BarChart3 size={20} className="opacity-50" />
                                                </div>
                                                <span className="text-sm font-medium">No recent bets to display</span>
                                            </div>
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
