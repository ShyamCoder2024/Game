'use client';

// src/app/admin/results/page.tsx
// Results Declaration Page — Live Bet Report + Declaration Form + Results Table

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';
import {
    Trophy, BarChart3, ArrowRightLeft, Undo2,
    ChevronDown, Loader2, AlertCircle, TrendingUp,
} from 'lucide-react';

// ==========================================
// TYPES
// ==========================================

interface Game {
    id: number;
    name: string;
    is_active: boolean;
    open_time: string;
    close_time: string;
}

interface MarketData {
    position: number;
    numbers: Record<string, number>;
}

interface LiveReportData {
    gameId: number;
    gameName: string;
    session: string;
    totalBets: number;
    totalAmount: number;
    markets: {
        single_akda: MarketData;
        single_patti: MarketData;
        double_patti: MarketData;
        triple_patti: MarketData;
        jodi: MarketData;
    };
}

interface MatchData {
    game_id: number;
    game_name: string;
    slug: string;
    open_time: string;
    close_time: string;
    open: { panna: string | null; single: number | null; is_settled: boolean } | null;
    close: { panna: string | null; single: number | null; jodi: string | null; is_settled: boolean } | null;
}

interface RollbackItem {
    id: number;
    game_id: number;
    date: string;
    session: string;
    game: { name: string };
    settlement: {
        id: number;
        total_bets: number;
        total_payout: number;
    };
    open_panna?: string | null;
    close_panna?: string | null;
    open_single?: number | null;
    close_single?: number | null;
    jodi?: string | null;
}

// ==========================================
// VALID PATTI NUMBERS (precomputed)
// ==========================================

function generateSinglePattiNumbers(): string[] {
    const nums: string[] = [];
    for (let a = 0; a <= 9; a++) {
        for (let b = a + 1; b <= 9; b++) {
            for (let c = b + 1; c <= 9; c++) {
                // All permutations of (a,b,c)
                const perms = [
                    `${a}${b}${c}`, `${a}${c}${b}`,
                    `${b}${a}${c}`, `${b}${c}${a}`,
                    `${c}${a}${b}`, `${c}${b}${a}`,
                ];
                perms.forEach(p => {
                    if (!nums.includes(p)) nums.push(p);
                });
            }
        }
    }
    return nums.sort();
}

function generateDoublePattiNumbers(): string[] {
    const nums: string[] = [];
    for (let a = 0; a <= 9; a++) {
        for (let b = 0; b <= 9; b++) {
            if (a === b) continue;
            // Two of 'a' and one of 'b'
            const combos = [`${a}${a}${b}`, `${a}${b}${a}`, `${b}${a}${a}`];
            combos.forEach(p => {
                if (!nums.includes(p)) nums.push(p);
            });
        }
    }
    return nums.sort();
}

function generateTriplePattiNumbers(): string[] {
    return Array.from({ length: 10 }, (_, i) => `${i}${i}${i}`);
}

function generateJodiNumbers(): string[] {
    return Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));
}

// ==========================================
// HELPERS
// ==========================================

function formatINR(amount: number): string {
    if (amount === 0) return '₹0';
    return '₹' + amount.toLocaleString('en-IN');
}

function calculateSingle(panna: string): number {
    const sum = panna.split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
    return sum % 10;
}

// ==========================================
// MARKET SECTION COMPONENT
// ==========================================

function MarketSection({
    title,
    position,
    numbers,
    allNumbers,
    betData,
}: {
    title: string;
    position: number;
    numbers: string[];
    allNumbers: boolean;
    betData: Record<string, number>;
}) {
    const gridClass = title.includes('Single Akda')
        ? 'grid-cols-5 sm:grid-cols-10'
        : title.includes('Triple')
            ? 'grid-cols-5 sm:grid-cols-10'
            : title.includes('Jodi')
                ? 'grid-cols-5 sm:grid-cols-10'
                : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10';

    const displayNumbers = allNumbers ? numbers : numbers.filter(n => betData[n] !== undefined);
    const numsToShow = allNumbers ? numbers : (displayNumbers.length > 0 ? numbers : []);

    return (
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-4 py-3 flex items-center justify-between">
                <span className="text-white font-semibold text-sm">
                    Market : {title}
                </span>
                <span className="text-white text-sm font-bold">
                    My Position : {formatINR(position)}
                </span>
            </div>

            {/* Number Grid */}
            <div className="p-3 bg-slate-50/50">
                {numsToShow.length > 0 ? (
                    <div className={`grid ${gridClass} gap-2`}>
                        {numsToShow.map((num) => {
                            const amount = betData[num] || 0;
                            return (
                                <div
                                    key={num}
                                    className="bg-white border border-slate-200 rounded-lg p-2 text-center
                                               hover:border-blue-300 hover:shadow-sm transition-all duration-150"
                                >
                                    <div className="font-mono font-bold text-slate-800 text-sm">
                                        {num}
                                    </div>
                                    <div className={`text-xs font-semibold mt-0.5 ${amount > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                                        {formatINR(amount)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4 text-slate-400 text-sm">
                        No bets placed for this market
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function ResultsPage() {
    const addToast = useToastStore((s) => s.addToast);

    // --- State ---
    const [games, setGames] = useState<Game[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
    const [session, setSession] = useState<'OPEN' | 'CLOSE'>('OPEN');

    // Live Report
    const [liveReport, setLiveReport] = useState<LiveReportData | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    // Declaration
    const [panna, setPanna] = useState('');
    const [declaring, setDeclaring] = useState(false);
    const [confirmDeclareOpen, setConfirmDeclareOpen] = useState(false);

    // Results table
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);

    // Rollback
    const [rollbackList, setRollbackList] = useState<RollbackItem[]>([]);
    const [rollbackTarget, setRollbackTarget] = useState<RollbackItem | null>(null);
    const [rollingBack, setRollingBack] = useState(false);

    // --- Precomputed number lists ---
    const singleAkdaNumbers = useMemo(() => Array.from({ length: 10 }, (_, i) => i.toString()), []);
    const singlePattiNumbers = useMemo(() => generateSinglePattiNumbers(), []);
    const doublePattiNumbers = useMemo(() => generateDoublePattiNumbers(), []);
    const triplePattiNumbers = useMemo(() => generateTriplePattiNumbers(), []);
    const jodiNumbers = useMemo(() => generateJodiNumbers(), []);

    // --- Selected game info ---
    const selectedGame = useMemo(() => games.find(g => g.id === selectedGameId) || null, [games, selectedGameId]);

    // --- Panna calculations ---
    const pannaValid = /^\d{3}$/.test(panna);
    const singleDigit = pannaValid ? calculateSingle(panna) : null;

    // Find existing OPEN result for jodi calculation
    const openResultForGame = useMemo(() => {
        if (!selectedGameId) return null;
        const match = matches.find(m => m.game_id === selectedGameId);
        return match?.open || null;
    }, [selectedGameId, matches]);

    const jodiPreview = useMemo(() => {
        if (session !== 'CLOSE' || !pannaValid || !openResultForGame || openResultForGame.single === null) return null;
        return `${openResultForGame.single}${singleDigit}`;
    }, [session, pannaValid, openResultForGame, singleDigit]);

    // ==========================================
    // DATA FETCHING
    // ==========================================

    const fetchGames = useCallback(async () => {
        try {
            const res = await api.get<Game[]>('/api/games/active');
            if (res.success && res.data) setGames(res.data);
        } catch { /* graceful */ }
    }, []);

    const fetchMatches = useCallback(async () => {
        setLoadingMatches(true);
        try {
            const res = await api.get<MatchData[]>('/api/admin/results/matches');
            if (res.success && res.data) setMatches(res.data);
        } catch { /* graceful */ }
        finally { setLoadingMatches(false); }
    }, []);

    const fetchRollbackList = useCallback(async () => {
        try {
            const res = await api.get<RollbackItem[]>('/api/admin/settlement/rollback-list');
            if (res.success && res.data) setRollbackList(res.data);
        } catch { /* graceful */ }
    }, []);

    const fetchLiveReport = useCallback(async () => {
        if (!selectedGameId) return;
        setLoadingReport(true);
        try {
            const res = await api.get<LiveReportData>('/api/admin/results/live-report', {
                gameId: selectedGameId.toString(),
                session,
            });
            if (res.success && res.data) {
                setLiveReport(res.data);
            } else {
                setLiveReport(null);
            }
        } catch {
            setLiveReport(null);
        } finally {
            setLoadingReport(false);
        }
    }, [selectedGameId, session]);

    // Initial load
    useEffect(() => {
        fetchGames();
        fetchMatches();
        fetchRollbackList();
    }, [fetchGames, fetchMatches, fetchRollbackList]);

    // Fetch live report when game/session changes
    useEffect(() => {
        if (selectedGameId) {
            fetchLiveReport();
        } else {
            setLiveReport(null);
        }
    }, [selectedGameId, session, fetchLiveReport]);

    // ==========================================
    // HANDLERS
    // ==========================================

    const handleDeclare = async () => {
        if (!selectedGameId || !pannaValid) return;
        setDeclaring(true);
        try {
            const res = await api.post('/api/admin/results/declare', {
                game_id: selectedGameId,
                session,
                panna,
            });
            if (res.success) {
                addToast(`Result declared successfully for ${selectedGame?.name} — ${session}`, 'success');
                setPanna('');
                fetchMatches();
                fetchLiveReport();
                fetchRollbackList();
            } else {
                addToast(res.error?.message || 'Failed to declare result', 'error');
            }
        } catch {
            addToast('Network error — could not declare result', 'error');
        } finally {
            setDeclaring(false);
            setConfirmDeclareOpen(false);
        }
    };

    const handleRollback = async () => {
        if (!rollbackTarget) return;
        setRollingBack(true);
        try {
            const res = await api.post(`/api/admin/settlement/rollback/${rollbackTarget.id}`);
            if (res.success) {
                addToast(`Rollback complete for ${rollbackTarget.game.name}`, 'success');
                fetchMatches();
                fetchRollbackList();
                fetchLiveReport();
            } else {
                addToast(res.error?.message || 'Rollback failed', 'error');
            }
        } catch {
            addToast('Network error — could not rollback', 'error');
        } finally {
            setRollingBack(false);
            setRollbackTarget(null);
        }
    };

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Trophy size={22} className="text-amber-500" />
                    Results — Declare &amp; Manage
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    View live bet positions, declare results, and manage settlements
                </p>
            </div>

            {/* Game + Session Selectors */}
            <Card className="border-0 shadow-md">
                <CardContent className="pt-5 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Select Game
                            </Label>
                            <div className="relative">
                                <select
                                    value={selectedGameId ?? ''}
                                    onChange={(e) => setSelectedGameId(Number(e.target.value) || null)}
                                    className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm
                                               font-medium text-slate-700 appearance-none cursor-pointer
                                               hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                                               transition-all outline-none"
                                >
                                    <option value="">Choose game...</option>
                                    {games.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Session
                            </Label>
                            <div className="relative">
                                <select
                                    value={session}
                                    onChange={(e) => setSession(e.target.value as 'OPEN' | 'CLOSE')}
                                    className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm
                                               font-medium text-slate-700 appearance-none cursor-pointer
                                               hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                                               transition-all outline-none"
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="CLOSE">Close</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================= */}
            {/* SECTION 1: LIVE BET REPORT                    */}
            {/* ============================================= */}
            {selectedGameId && (
                <div className="space-y-4">
                    {/* Report header bar */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={18} className="text-blue-400" />
                            <span className="text-white font-bold text-base">
                                {selectedGame?.name ?? 'Game'} — {session === 'OPEN' ? 'Open' : 'Close'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-300">
                                Total Bets: <span className="text-white font-bold">{liveReport?.totalBets ?? 0}</span>
                            </span>
                            <span className="text-slate-300">
                                Total Amount: <span className="text-emerald-400 font-bold">{formatINR(liveReport?.totalAmount ?? 0)}</span>
                            </span>
                        </div>
                    </div>

                    {loadingReport ? (
                        /* Skeleton loader */
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="rounded-xl overflow-hidden border border-slate-200">
                                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 h-11 animate-pulse" />
                                    <div className="p-3 bg-slate-50/50">
                                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                            {Array.from({ length: 10 }).map((_, j) => (
                                                <div key={j} className="bg-white border border-slate-100 rounded-lg p-2">
                                                    <div className="h-4 bg-slate-200 rounded animate-pulse mb-1 mx-auto w-6" />
                                                    <div className="h-3 bg-slate-100 rounded animate-pulse mx-auto w-10" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : liveReport ? (
                        <div className="space-y-4">
                            <MarketSection
                                title="Single Akda"
                                position={liveReport.markets.single_akda.position}
                                numbers={singleAkdaNumbers}
                                allNumbers={true}
                                betData={liveReport.markets.single_akda.numbers}
                            />
                            <MarketSection
                                title="Single Patti"
                                position={liveReport.markets.single_patti.position}
                                numbers={singlePattiNumbers}
                                allNumbers={true}
                                betData={liveReport.markets.single_patti.numbers}
                            />
                            <MarketSection
                                title="Double Patti"
                                position={liveReport.markets.double_patti.position}
                                numbers={doublePattiNumbers}
                                allNumbers={true}
                                betData={liveReport.markets.double_patti.numbers}
                            />
                            <MarketSection
                                title="Triple Patti"
                                position={liveReport.markets.triple_patti.position}
                                numbers={triplePattiNumbers}
                                allNumbers={true}
                                betData={liveReport.markets.triple_patti.numbers}
                            />
                            <MarketSection
                                title="Jodi"
                                position={liveReport.markets.jodi.position}
                                numbers={jodiNumbers}
                                allNumbers={true}
                                betData={liveReport.markets.jodi.numbers}
                            />
                        </div>
                    ) : (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="py-12 text-center">
                                <AlertCircle size={40} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-base font-medium text-slate-600">No bets placed yet for this session</p>
                                <p className="text-xs text-slate-400 mt-1">Live report will populate as bets come in</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ============================================= */}
            {/* SECTION 2: RESULT DECLARATION FORM            */}
            {/* ============================================= */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <Trophy size={16} className="text-amber-500" />
                        Declare Result
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!selectedGameId ? (
                        <p className="text-sm text-slate-400 py-4 text-center">
                            Select a game and session above to declare a result
                        </p>
                    ) : (
                        <div className="space-y-4 max-w-md">
                            {/* Game + Session display */}
                            <div className="flex items-center gap-2 text-sm">
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                    {selectedGame?.name}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                    {session}
                                </Badge>
                            </div>

                            {/* Panna input */}
                            <div className="space-y-1.5">
                                <Label className="text-sm text-slate-600">Enter Winning Panna</Label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={3}
                                    value={panna}
                                    onChange={(e) => setPanna(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                    placeholder="e.g. 388"
                                    className="bg-slate-50 font-mono text-lg tracking-widest max-w-[160px]"
                                />
                            </div>

                            {/* Auto-calculated preview */}
                            {pannaValid && singleDigit !== null && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <TrendingUp size={14} className="text-blue-600" />
                                        <span className="text-slate-600">
                                            Panna: <span className="font-mono font-bold text-blue-700">{panna}</span>
                                            {' → '}
                                            Single: <span className="font-mono font-bold text-blue-700">{singleDigit}</span>
                                        </span>
                                    </div>
                                    {jodiPreview && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <ArrowRightLeft size={14} className="text-blue-600" />
                                            <span className="text-slate-600">
                                                Jodi: <span className="font-mono font-bold text-blue-700">{jodiPreview}</span>
                                                {' '}
                                                <span className="text-xs text-slate-400">
                                                    (Open: {openResultForGame?.single}, Close: {singleDigit})
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Declare button */}
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                onClick={() => setConfirmDeclareOpen(true)}
                                disabled={!pannaValid || declaring}
                            >
                                {declaring ? (
                                    <><Loader2 size={14} className="mr-1.5 animate-spin" /> Declaring...</>
                                ) : (
                                    <><Trophy size={14} className="mr-1.5" /> Declare Result</>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ============================================= */}
            {/* SECTION 3: TODAY'S DECLARED RESULTS TABLE      */}
            {/* ============================================= */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-700">
                        Today&apos;s Declared Results
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase">Game</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">Session</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">Panna</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">Single</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">Jodi</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingMatches ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <td key={j} className="py-3 px-4">
                                                    <div className="h-4 bg-slate-200 rounded animate-pulse w-16 mx-auto" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : matches.length > 0 ? (
                                    matches.map((m) => {
                                        // Show rows for each declared session
                                        const rows: JSX.Element[] = [];

                                        if (m.open) {
                                            const rb = rollbackList.find(r => r.game_id === m.game_id && r.session === 'OPEN');
                                            rows.push(
                                                <tr key={`${m.game_id}-open`} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="py-3 px-4 font-medium text-slate-700">{m.game_name}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge variant="outline" className="text-xs">Open</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-mono font-bold text-lg text-blue-600">
                                                        {m.open.panna ?? '—'}
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-mono font-bold text-lg text-blue-600">
                                                        {m.open.single ?? '—'}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-slate-400">—</td>
                                                    <td className="py-3 px-4 text-center">
                                                        {m.open.is_settled ? (
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Settled</Badge>
                                                        ) : (
                                                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {rb && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-2"
                                                                onClick={() => setRollbackTarget(rb)}
                                                            >
                                                                <Undo2 size={12} className="mr-1" /> Rollback
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        if (m.close) {
                                            const rb = rollbackList.find(r => r.game_id === m.game_id && r.session === 'CLOSE');
                                            rows.push(
                                                <tr key={`${m.game_id}-close`} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="py-3 px-4 font-medium text-slate-700">{m.game_name}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge variant="outline" className="text-xs">Close</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-mono font-bold text-lg text-blue-600">
                                                        {m.close.panna ?? '—'}
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-mono font-bold text-lg text-blue-600">
                                                        {m.close.single ?? '—'}
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-mono font-bold text-lg text-amber-600">
                                                        {m.close.jodi ?? '—'}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {m.close.is_settled ? (
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Settled</Badge>
                                                        ) : (
                                                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {rb && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-2"
                                                                onClick={() => setRollbackTarget(rb)}
                                                            >
                                                                <Undo2 size={12} className="mr-1" /> Rollback
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return rows;
                                    }).flat()
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center py-6">
                                                <Trophy size={40} className="text-slate-200 mb-3" />
                                                <p className="text-base font-medium text-slate-600">No results declared today</p>
                                                <p className="text-xs text-slate-400 mt-1">Declared results will appear here</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================= */}
            {/* CONFIRM DIALOGS                                */}
            {/* ============================================= */}

            {/* Declare Result Confirmation */}
            <ConfirmDialog
                open={confirmDeclareOpen}
                onClose={() => setConfirmDeclareOpen(false)}
                onConfirm={handleDeclare}
                title="Confirm Result Declaration"
                message={`Are you sure you want to declare ${selectedGame?.name ?? 'Game'} ${session} result as Panna ${panna}? This action will trigger settlement for all pending bets.`}
                confirmLabel="Declare & Settle"
                variant="warning"
                loading={declaring}
            />

            {/* Rollback Confirmation */}
            <ConfirmDialog
                open={!!rollbackTarget}
                onClose={() => setRollbackTarget(null)}
                onConfirm={handleRollback}
                title="Confirm Rollback"
                message={`Are you sure you want to rollback ${rollbackTarget?.game?.name ?? ''} ${rollbackTarget?.session ?? ''}? This will reverse all settlements and restore balances.`}
                confirmLabel="Rollback"
                variant="danger"
                loading={rollingBack}
            />
        </div>
    );
}
