'use client';

// src/app/admin/games/page.tsx
// Game management — list, toggle, add, multiplier management

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api } from '@/lib/api';
import { BET_TYPES } from '@/lib/constants';
import { motion } from 'framer-motion';
import {
    Gamepad2, Plus, Power, Clock, Settings2, X, Save, Umbrella,
} from 'lucide-react';

interface Game {
    id: number;
    name: string;
    is_active: boolean;
    is_holiday: boolean;
    color_code: string;
    open_time: string;
    close_time: string;
    result_time: string;
    sort_order: number;
}

interface Multiplier {
    bet_type: string;
    multiplier: number;
}

export default function GamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggleTarget, setToggleTarget] = useState<Game | null>(null);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [addName, setAddName] = useState('');
    const [addOpenTime, setAddOpenTime] = useState('');
    const [addCloseTime, setAddCloseTime] = useState('');
    const [addResultTime, setAddResultTime] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [addColor, setAddColor] = useState('#3B82F6');
    const [multiplierGame, setMultiplierGame] = useState<Game | null>(null);
    const [multipliers, setMultipliers] = useState<Multiplier[]>([]);
    const [mulLoading, setMulLoading] = useState(false);
    const [holidayLoading, setHolidayLoading] = useState<number | 'all' | null>(null);

    const fetchGames = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<Game[]>('/api/games/active');
            if (res.success && res.data) setGames(res.data);
        } catch { /* graceful */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchGames(); }, [fetchGames]);

    const handleToggle = async () => {
        if (!toggleTarget) return;
        setToggleLoading(true);
        try {
            await api.put(`/api/admin/games/${toggleTarget.id}/toggle`);
            fetchGames();
        } catch { /* graceful */ } finally {
            setToggleLoading(false);
            setToggleTarget(null);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError('');
        setAddLoading(true);
        try {
            const res = await api.post('/api/admin/games', {
                name: addName, open_time: addOpenTime,
                close_time: addCloseTime, result_time: addResultTime,
                color_code: addColor,
            });
            if (!res.success) {
                setAddError(res.error?.message || 'Failed to create game. Please try again.');
                return;
            }
            // Only close and reset on success
            setAddOpen(false);
            setAddName(''); setAddOpenTime(''); setAddCloseTime(''); setAddResultTime(''); setAddColor('#3B82F6');
            fetchGames();
        } catch { setAddError('Network error. Please try again.'); } finally { setAddLoading(false); }
    };

    const openMultipliers = async (game: Game) => {
        setMultiplierGame(game);
        try {
            const res = await api.get<Multiplier[]>(`/api/games/${game.id}/multipliers`);
            if (res.success && res.data) {
                setMultipliers(res.data);
            } else {
                // Use defaults
                setMultipliers(
                    Object.entries(BET_TYPES).map(([key, bt]) => ({
                        bet_type: key,
                        multiplier: bt.defaultMultiplier,
                    }))
                );
            }
        } catch {
            setMultipliers(
                Object.entries(BET_TYPES).map(([key, bt]) => ({
                    bet_type: key,
                    multiplier: bt.defaultMultiplier,
                }))
            );
        }
    };

    const saveMultipliers = async () => {
        if (!multiplierGame) return;
        setMulLoading(true);
        try {
            await api.put(`/api/admin/games/${multiplierGame.id}/multipliers`, { multipliers });
            setMultiplierGame(null);
        } catch { /* graceful */ } finally { setMulLoading(false); }
    };

    const handleHolidayToggle = async (gameId: number, isHoliday: boolean) => {
        setHolidayLoading(gameId);
        try {
            await api.put(`/api/admin/games/${gameId}/holiday`, { is_holiday: isHoliday });
            fetchGames();
        } catch { /* graceful */ } finally { setHolidayLoading(null); }
    };

    const handleHolidayAll = async (isHoliday: boolean) => {
        setHolidayLoading('all');
        try {
            await api.put('/api/admin/games/holiday-all', { is_holiday: isHoliday });
            fetchGames();
        } catch { /* graceful */ } finally { setHolidayLoading(null); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Games</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage games, timings, and multipliers</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setAddOpen(true)}>
                    <Plus size={16} className="mr-1" />
                    Add Game
                </Button>
            </div>

            {/* Games grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="border-0 shadow-md">
                            <CardContent className="p-5">
                                <Skeleton className="h-5 w-32 mb-3" />
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-4 w-20" />
                            </CardContent>
                        </Card>
                    ))
                    : games.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl shadow-sm border border-slate-100">
                            <Gamepad2 size={48} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-lg font-medium text-slate-600">No games found</p>
                            <p className="text-sm text-slate-400 mt-1">Create a new game to get started</p>
                        </div>
                    )
                        : games.map((game, i) => (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full overflow-hidden">
                                    <div className="h-1 w-full" style={{ backgroundColor: game.color_code || '#3B82F6' }} />
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: game.color_code || '#3B82F6' }} />
                                                <h3 className="font-semibold text-slate-800">{game.name}</h3>
                                            </div>
                                            <Badge className={game.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                                                {game.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-400" />
                                                <span>Open: {game.open_time} | Close: {game.close_time}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-400" />
                                                <span>Result: {game.result_time}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setToggleTarget(game)}>
                                                <Power size={12} className="mr-1" />
                                                {game.is_active ? 'Disable' : 'Enable'}
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openMultipliers(game)}>
                                                <Settings2 size={12} className="mr-1" />
                                                Multipliers
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
            </div>

            {/* Holiday Management */}
            <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Umbrella size={18} className="text-orange-500" />
                        <h2 className="text-base font-semibold text-slate-700">Holiday Management</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleHolidayAll(true)} disabled={holidayLoading === 'all'}>
                            <Umbrella size={12} className="mr-1" /> Set All Holiday
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleHolidayAll(false)} disabled={holidayLoading === 'all'}>
                            Lift All Holiday
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {games.map((game) => (
                        <div key={game.id} className={`flex items-center justify-between p-3 rounded-lg border ${game.is_holiday ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">{game.name}</p>
                                <p className={`text-xs font-medium mt-0.5 ${game.is_holiday ? 'text-orange-600' : 'text-green-600'}`}>
                                    {game.is_holiday ? '🏖 On Holiday' : '✅ Running'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleHolidayToggle(game.id, !game.is_holiday)}
                                disabled={holidayLoading === game.id}
                                className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${game.is_holiday ? 'bg-orange-500' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${game.is_holiday ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    ))}
                    {games.length === 0 && !loading && (
                        <p className="col-span-full text-sm text-slate-400 text-center py-4">No games to manage</p>
                    )}
                </div>
            </div>

            {/* Toggle confirmation */}
            <ConfirmDialog
                open={!!toggleTarget}
                onClose={() => setToggleTarget(null)}
                onConfirm={handleToggle}
                title={`${toggleTarget?.is_active ? 'Disable' : 'Enable'} ${toggleTarget?.name || ''}?`}
                message={toggleTarget?.is_active
                    ? 'This will prevent new bets from being placed on this game.'
                    : 'This will allow bets to be placed on this game.'}
                confirmLabel={toggleTarget?.is_active ? 'Disable' : 'Enable'}
                variant={toggleTarget?.is_active ? 'warning' : 'info'}
                loading={toggleLoading}
            />

            {/* Add game modal */}
            {
                addOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setAddOpen(false); setAddError(''); }} />
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                            <button onClick={() => { setAddOpen(false); setAddError(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Game</h3>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Game Name</Label>
                                    <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. KALYAN" required className="bg-slate-50" />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Open Time</Label>
                                        <Input value={addOpenTime} onChange={(e) => setAddOpenTime(e.target.value)} placeholder="09:00" required className="bg-slate-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Close Time</Label>
                                        <Input value={addCloseTime} onChange={(e) => setAddCloseTime(e.target.value)} placeholder="11:00" required className="bg-slate-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Result Time</Label>
                                        <Input value={addResultTime} onChange={(e) => setAddResultTime(e.target.value)} placeholder="11:30" required className="bg-slate-50" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Card Color</Label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={addColor}
                                            onChange={(e) => setAddColor(e.target.value)}
                                            className="w-10 h-10 rounded cursor-pointer border border-slate-200"
                                        />
                                        <span className="text-sm text-slate-500 font-mono">{addColor}</span>
                                    </div>
                                </div>
                                {addError && (
                                    <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-100">
                                        {addError}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => { setAddOpen(false); setAddError(''); }}>Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={addLoading}>
                                        {addLoading ? 'Adding...' : 'Add Game'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Multiplier editor modal */}
            {
                multiplierGame && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMultiplierGame(null)} />
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                            <button onClick={() => setMultiplierGame(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">Multipliers — {multiplierGame.name}</h3>
                            <p className="text-xs text-slate-500 mb-4">Set payout multipliers per bet type</p>
                            <div className="space-y-3">
                                {multipliers.map((mul, i) => {
                                    const bt = BET_TYPES[mul.bet_type as keyof typeof BET_TYPES];
                                    return (
                                        <div key={mul.bet_type} className="flex items-center justify-between gap-3">
                                            <Label className="text-sm w-32">{bt?.name || mul.bet_type}</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={mul.multiplier}
                                                onChange={(e) => {
                                                    const updated = [...multipliers];
                                                    updated[i] = { ...mul, multiplier: Number(e.target.value) };
                                                    setMultipliers(updated);
                                                }}
                                                className="w-24 bg-slate-50 text-right font-mono"
                                            />
                                            <span className="text-xs text-slate-400">x</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={saveMultipliers} disabled={mulLoading}>
                                <Save size={14} className="mr-1" />
                                {mulLoading ? 'Saving...' : 'Save Multipliers'}
                            </Button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
