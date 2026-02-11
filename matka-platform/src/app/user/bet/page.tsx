'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Target, ChevronRight, Coins, AlertCircle } from 'lucide-react';
import { BET_TYPES } from '@/lib/constants';

interface ActiveGame {
    id: number;
    name: string;
    color: string;
    open_time: string;
    close_time: string;
    status: 'open' | 'closed';
}

type BetTypeKey = keyof typeof BET_TYPES;

export default function UserBetPage() {
    const [step, setStep] = useState(1);
    const [games, setGames] = useState<ActiveGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState<ActiveGame | null>(null);
    const [selectedBetType, setSelectedBetType] = useState<BetTypeKey | null>(null);
    const [number, setNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [placing, setPlacing] = useState(false);
    const balance = 25000; // From state in real app

    const fetchGames = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<ActiveGame[]>('/api/games', { status: 'active' });
            if (res.success && res.data) setGames(res.data);
        } catch {
            setGames([
                { id: 1, name: 'SRIDEVI', color: '#22C55E', open_time: '12:00 PM', close_time: '01:00 PM', status: 'open' },
                { id: 2, name: 'KALYAN', color: '#F97316', open_time: '04:00 PM', close_time: '06:00 PM', status: 'open' },
                { id: 3, name: 'MILAN DAY', color: '#EAB308', open_time: '01:30 PM', close_time: '03:30 PM', status: 'closed' },
                { id: 4, name: 'RAJDHANI', color: '#A855F7', open_time: '09:00 PM', close_time: '11:00 PM', status: 'open' },
                { id: 5, name: 'TIME BAZAR', color: '#EF4444', open_time: '01:00 PM', close_time: '02:00 PM', status: 'closed' },
            ]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchGames(); }, [fetchGames]);

    const potentialWin = selectedBetType && amount ? Number(amount) * BET_TYPES[selectedBetType].defaultMultiplier : 0;

    const handlePlaceBet = async () => {
        if (!selectedGame || !selectedBetType || !number || !amount) return;
        setPlacing(true);
        try {
            await api.post('/api/bets/place', {
                gameId: selectedGame.id,
                betType: selectedBetType,
                number,
                amount: Number(amount),
            });
            setStep(1);
            setSelectedGame(null);
            setSelectedBetType(null);
            setNumber('');
            setAmount('');
        } catch { /* handled */ }
        setPlacing(false);
    };

    const betTypeEntries = Object.entries(BET_TYPES) as [BetTypeKey, typeof BET_TYPES[BetTypeKey]][];

    return (
        <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-[#059669] text-white' : 'bg-gray-200 text-gray-500'
                            }`}>{s}</div>
                        {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-[#059669]' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Select Game */}
            {step === 1 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Target size={20} className="text-[#059669]" /> Select Game
                    </h2>
                    {loading ? (
                        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
                    ) : (
                        <div className="space-y-2">
                            {games.map((game) => (
                                <button
                                    key={game.id}
                                    disabled={game.status === 'closed'}
                                    onClick={() => { setSelectedGame(game); setStep(2); }}
                                    className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all ${game.status === 'closed'
                                            ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                                            : 'bg-white hover:shadow-md hover:border-[#059669] border border-transparent'
                                        }`}
                                >
                                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: game.color }} />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{game.name}</p>
                                        <p className="text-xs text-gray-500">{game.open_time} — {game.close_time}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${game.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {game.status === 'open' ? '● Open' : '○ Closed'}
                                        </span>
                                        {game.status === 'open' && <ChevronRight size={16} className="text-gray-400" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Select Bet Type */}
            {step === 2 && selectedGame && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setStep(1)} className="text-sm text-[#059669] font-semibold">← Back</button>
                        <h2 className="text-lg font-bold text-gray-800">{selectedGame.name} — Bet Type</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {betTypeEntries.map(([key, bt]) => (
                            <button
                                key={key}
                                onClick={() => { setSelectedBetType(key); setStep(3); }}
                                className="bg-white p-4 rounded-xl text-center hover:shadow-md hover:border-[#059669] border border-transparent transition-all"
                            >
                                <p className="text-2xl font-extrabold text-[#059669] mb-1">{bt.defaultMultiplier}x</p>
                                <p className="text-sm font-bold text-gray-800">{bt.name}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{bt.shortName}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Enter Number & Amount */}
            {step === 3 && selectedGame && selectedBetType && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setStep(2)} className="text-sm text-[#059669] font-semibold">← Back</button>
                        <h2 className="text-lg font-bold text-gray-800">{BET_TYPES[selectedBetType].name}</h2>
                    </div>

                    <div className="bg-white rounded-xl p-4 space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Number</label>
                            <input
                                type="text"
                                value={number}
                                onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter number"
                                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-center text-xl font-bold tracking-widest focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
                                maxLength={3}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter amount"
                                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-center text-xl font-bold focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {amount && (
                        <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Bet Amount</span>
                                <span className="font-bold text-gray-800">₹{Number(amount).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Multiplier</span>
                                <span className="font-bold text-[#059669]">{BET_TYPES[selectedBetType].defaultMultiplier}x</span>
                            </div>
                            <div className="border-t border-emerald-200 my-1" />
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 font-semibold">Potential Win</span>
                                <span className="font-extrabold text-[#059669] text-lg">₹{potentialWin.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Current Balance</span>
                                <span>₹{balance.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Balance After Bet</span>
                                <span>₹{(balance - Number(amount)).toLocaleString('en-IN')}</span>
                            </div>
                            {Number(amount) > balance && (
                                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                                    <AlertCircle size={12} /> Insufficient balance
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handlePlaceBet}
                        disabled={!number || !amount || Number(amount) > balance || placing}
                        className="w-full py-4 rounded-xl bg-[#059669] text-white font-bold text-lg hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Coins size={20} />
                        {placing ? 'Placing...' : 'Place Bet'}
                    </button>
                </div>
            )}
        </div>
    );
}
