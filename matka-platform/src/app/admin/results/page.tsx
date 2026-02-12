'use client';

// src/app/admin/results/page.tsx
// Results declaration UI — select game, session, enter OC/CP digits

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api } from '@/lib/api';
import { useSocketStore } from '@/store/socketStore';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { Trophy, CheckCircle2, Clock } from 'lucide-react';

interface Game {
    id: number; name: string; is_active: boolean;
    open_time: string; close_time: string;
}

interface ResultEntry {
    id: number; game_id: number; game_name: string; session: string;
    date: string; oc_digit: number | null; cp_digit: number | null;
    declared_at: string | null; status: string;
}

export default function ResultsPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [selectedGame, setSelectedGame] = useState<number | null>(null);
    const [session, setSession] = useState<'open' | 'close'>('open');
    const [ocDigit, setOcDigit] = useState('');
    const [cpDigit, setCpDigit] = useState('');
    const [results, setResults] = useState<ResultEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [declaring, setDeclaring] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const fetchGames = useCallback(async () => {
        try {
            const res = await api.get<Game[]>('/api/games/active');
            if (res.success && res.data) setGames(res.data);
        } catch { /* graceful */ }
    }, []);

    const fetchResults = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<ResultEntry[]>('/api/admin/results/today');
            if (res.success && res.data) setResults(res.data);
        } catch { /* graceful */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchGames(); fetchResults(); }, [fetchGames, fetchResults]);

    // Auto-refresh when new result is declared via WebSocket
    const lastResult = useSocketStore((s) => s.lastResult);
    useSocketEvent(lastResult, () => { fetchResults(); });

    const handleDeclare = async () => {
        if (!selectedGame) return;
        setDeclaring(true);
        try {
            await api.post('/api/admin/results/declare', {
                game_id: selectedGame,
                session,
                oc_digit: ocDigit ? Number(ocDigit) : null,
                cp_digit: cpDigit ? Number(cpDigit) : null,
            });
            setOcDigit(''); setCpDigit('');
            fetchResults();
        } catch { /* graceful */ } finally {
            setDeclaring(false); setConfirmOpen(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Results</h1>
                <p className="text-sm text-slate-500 mt-1">Declare game results and view today&apos;s declarations</p>
            </div>

            {/* Declaration form */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <Trophy size={16} className="text-amber-500" />
                        Declare Result
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <Label className="text-sm text-slate-600">Game</Label>
                            <select
                                value={selectedGame ?? ''}
                                onChange={(e) => setSelectedGame(Number(e.target.value) || null)}
                                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                            >
                                <option value="">Select game...</option>
                                {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-slate-600">Session</Label>
                            <select
                                value={session}
                                onChange={(e) => setSession(e.target.value as 'open' | 'close')}
                                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                            >
                                <option value="open">Open</option>
                                <option value="close">Close</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-slate-600">OC Digit (0-9)</Label>
                            <Input type="number" min="0" max="9" value={ocDigit} onChange={(e) => setOcDigit(e.target.value)} placeholder="0-9" className="bg-slate-50" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-slate-600">CP Digit (0-9)</Label>
                            <Input type="number" min="0" max="9" value={cpDigit} onChange={(e) => setCpDigit(e.target.value)} placeholder="0-9" className="bg-slate-50" />
                        </div>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => setConfirmOpen(true)}
                            disabled={!selectedGame}
                        >
                            <Trophy size={14} className="mr-1" />
                            Declare Result
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Today's results */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-700">
                        Today&apos;s Results
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase">Game</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">Session</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">OC Digit</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">CP Digit</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <td key={j} className="py-3 px-4">
                                                    <div className="h-4 bg-slate-200 rounded animate-pulse w-16 mx-auto" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : results.length > 0 ? (
                                    results.map((r) => (
                                        <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4 font-medium text-slate-700">{r.game_name}</td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant="outline" className="text-xs capitalize">{r.session}</Badge>
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono font-bold text-lg text-blue-600">
                                                {r.oc_digit ?? '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono font-bold text-lg text-blue-600">
                                                {r.cp_digit ?? '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {r.status === 'declared' ? (
                                                    <Badge className="bg-green-100 text-green-700"><CheckCircle2 size={12} className="mr-1" />Declared</Badge>
                                                ) : (
                                                    <Badge className="bg-yellow-100 text-yellow-700"><Clock size={12} className="mr-1" />Pending</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center text-xs text-slate-500">
                                                {r.declared_at || '—'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
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

            <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDeclare}
                title="Confirm Result Declaration"
                message={`Are you sure you want to declare the ${session} result? This action will trigger settlement for all bets.`}
                confirmLabel="Declare & Settle"
                variant="warning"
                loading={declaring}
            />
        </div>
    );
}
