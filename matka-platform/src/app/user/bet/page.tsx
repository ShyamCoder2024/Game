'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Gamepad2, ChevronRight, AlertCircle, Coins, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocketStore } from '@/store/socketStore';
import { useToastStore } from '@/store/toastStore';

// Define Bet Types constant based on schema
const BET_TYPES: Record<string, { name: string; shortName: string; defaultMultiplier: number }> = {
    SINGLE_AKDA: { name: 'Single Digit', shortName: 'Single', defaultMultiplier: 9.5 },
    JODI: { name: 'Jodi', shortName: 'Jodi', defaultMultiplier: 95 },
    SINGLE_PATTI: { name: 'Single Patti', shortName: 'SP', defaultMultiplier: 140 },
    DOUBLE_PATTI: { name: 'Double Patti', shortName: 'DP', defaultMultiplier: 280 },
    TRIPLE_PATTI: { name: 'Triple Patti', shortName: 'TP', defaultMultiplier: 600 },
};

interface Game {
    id: number;
    name: string;
    open_time: string;
    close_time: string;
    status: 'open' | 'closed';
    color: string;
}

export default function UserBetPage() {
    const searchParams = useSearchParams();
    const gameIdParam = searchParams.get('gameId');

    // State
    const [loading, setLoading] = useState(true);
    const [games, setGames] = useState<Game[]>([]);
    const [step, setStep] = useState(1);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [selectedBetType, setSelectedBetType] = useState<string | null>(null);
    const [betNumber, setBetNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [session, setSession] = useState<'OPEN' | 'CLOSE'>('OPEN');
    const [placing, setPlacing] = useState(false);
    const [windowClosed, setWindowClosed] = useState(false);

    // Store
    const liveBalance = useSocketStore((s) => s.liveBalance);
    const balance = liveBalance || 0;
    const { addToast } = useToastStore();

    // Fetch games
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const res = await api.get<Game[]>('/api/games/active');
                if (res.success && res.data) {
                    setGames(res.data);
                }
            } catch (_error) {
                console.error('Failed to fetch games', _error);
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, []);

    // Auto-select game from URL
    useEffect(() => {
        if (gameIdParam && games.length > 0 && !selectedGame && step === 1) {
            const game = games.find((g) => g.id === Number(gameIdParam));
            if (game) {
                setSelectedGame(game);
                setStep(2);
            }
        }
    }, [games, gameIdParam, selectedGame, step]);

    const handlePlaceBet = async () => {
        if (!selectedGame || !selectedBetType || !betNumber || !amount) return;

        setPlacing(true);
        try {
            const res = await api.post('/api/bets/place', {
                game_id: selectedGame.id,
                bet_type: selectedBetType,
                bet_number: betNumber,
                session,
                amount: Number(amount),
            });

            if (res.success) {
                addToast('Bet placed successfully!', 'success');
                setStep(1);
                setBetNumber('');
                setAmount('');
                setSelectedBetType(null);
                setSelectedGame(null);
            } else {
                addToast(res.error?.message || 'Failed to place bet', 'error');
            }
        } catch {
            addToast('Network error occurred', 'error');
        } finally {
            setPlacing(false);
        }
    };

    const betTypeEntries = Object.entries(BET_TYPES);
    const currentMultiplier = selectedBetType ? BET_TYPES[selectedBetType].defaultMultiplier : 0;
    const potentialWin = Number(amount) * currentMultiplier;

    return (
        <div className="pb-24 min-h-screen bg-[#F5F7FA]">
            {/* Sticky Header */}
            <div className="sticky top-[70px] z-20 bg-[#F5F7FA]/95 backdrop-blur-md pb-2 pt-4 px-4 mb-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-xl font-black text-[#003366] flex items-center gap-2 tracking-tight">
                            <span className="bg-[#E6F0FF] p-1.5 rounded-lg text-[#003366]">
                                <Gamepad2 size={20} />
                            </span>
                            Place Bet
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mt-1 ml-1">
                            {step === 1 ? 'Select Game' : step === 2 ? 'Choose Type' : 'Enter Details'}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                        <Coins size={14} className="text-amber-500" />
                        <span className="text-sm font-bold text-amber-900">₹{balance.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-lg">
                {/* Step 1: Select Game */}
                {step === 1 && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : games.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                    <Gamepad2 size={40} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">No Active Games</h3>
                                <p className="text-sm text-gray-500 max-w-[200px] mb-6">
                                    There are currently no games available for betting.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 shadow-sm active:scale-95 transition-all"
                                >
                                    Refresh Schedule
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {games.map((game) => (
                                    <button
                                        key={game.id}
                                        disabled={game.status === 'closed'}
                                        onClick={() => { setSelectedGame(game); setStep(2); setWindowClosed(false); }}
                                        className={`w-full relative overflow-hidden group transition-all duration-300 ${game.status === 'closed'
                                            ? 'opacity-60 grayscale cursor-not-allowed'
                                            : 'hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]'
                                            }`}
                                    >
                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative z-10">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: game.color }} />
                                                    <div className="text-left">
                                                        <h3 className="text-lg font-black text-[#003366] leading-none mb-1.5">
                                                            {game.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            <span>Open: {game.open_time}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                            <span>Close: {game.close_time}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${game.status === 'open'
                                                    ? 'bg-emerald-50 text-[#059669] border border-emerald-100'
                                                    : 'bg-red-50 text-red-600 border border-red-100'
                                                    }`}>
                                                    {game.status === 'open' ? 'Live' : 'Closed'}
                                                </div>
                                            </div>

                                            {game.status === 'open' && (
                                                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                                                    <span className="text-xs text-gray-400 font-medium">Click to Play</span>
                                                    <div className="w-6 h-6 rounded-full bg-[#003366] flex items-center justify-center text-white">
                                                        <ChevronRight size={14} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Select Bet Type */}
                {step === 2 && selectedGame && (
                    <div className="space-y-4 animate-in slide-in-from-right-10 duration-300">
                        <button
                            onClick={() => setStep(1)}
                            className="text-xs font-bold text-gray-400 hover:text-[#003366] flex items-center gap-1 transition-colors pl-1"
                        >
                            <ArrowLeft size={14} /> Back to Games
                        </button>

                        <div className="bg-[#003366] rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                            <h2 className="text-2xl font-black">{selectedGame.name}</h2>
                            <p className="text-white/60 text-xs font-medium mt-1">Select a market to place your bet</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {betTypeEntries.map(([key, bt]) => (
                                <button
                                    key={key}
                                    onClick={() => { setSelectedBetType(key); setStep(3); }}
                                    className="bg-white p-4 rounded-2xl text-center border border-gray-100 shadow-sm hover:border-[#059669] hover:bg-emerald-50/30 active:scale-95 transition-all group"
                                >
                                    <div className="w-10 h-10 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#059669] transition-colors">
                                        <Coins size={18} className="text-[#059669] group-hover:text-white transition-colors" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-800">{bt.name}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">{bt.shortName}</p>
                                    <div className="mt-2 text-xs font-black text-[#059669] bg-white py-1 px-2 rounded-lg inline-block border border-gray-100">
                                        {bt.defaultMultiplier}x
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Enter Number & Amount */}
                {step === 3 && selectedGame && selectedBetType && (
                    <div className="space-y-4 animate-in slide-in-from-right-10 duration-300">
                        <button
                            onClick={() => setStep(2)}
                            className="text-xs font-bold text-gray-400 hover:text-[#003366] flex items-center gap-1 transition-colors pl-1"
                        >
                            <ArrowLeft size={14} /> Back to Markets
                        </button>

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-black text-[#003366] text-center mb-6">
                                {BET_TYPES[selectedBetType].name}
                            </h2>

                            <div className="space-y-5">
                                {/* Session selector */}
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 block mb-1.5">
                                        Session
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSession('OPEN')}
                                            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${session === 'OPEN'
                                                    ? 'bg-[#003366] text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            🌅 OPEN
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSession('CLOSE')}
                                            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${session === 'CLOSE'
                                                    ? 'bg-[#003366] text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            🌙 CLOSE
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 block mb-1.5">
                                        Lucky Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={betNumber}
                                        onChange={(e) => setBetNumber(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000"
                                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-center text-3xl font-black tracking-[0.5em] text-[#003366] placeholder:text-gray-300 focus:border-[#003366] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#003366]/5 transition-all"
                                        maxLength={3}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 block mb-1.5">
                                        Amount (₹)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                                        <input
                                            type="tel"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                                            placeholder="500"
                                            className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-center text-2xl font-bold text-gray-800 placeholder:text-gray-300 focus:border-[#003366] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#003366]/5 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Receipt Preview */}
                        {amount && (
                            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#003366] to-[#059669]" />

                                <div className="p-5 space-y-3">
                                    <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-200">
                                        <span className="text-xs font-medium text-gray-400">Total Bet</span>
                                        <span className="text-lg font-bold text-gray-800">₹{Number(amount).toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Potential Win</p>
                                            <p className="text-2xl font-black text-[#059669]">
                                                ₹{potentialWin.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rate</p>
                                            <p className="text-sm font-bold text-[#003366] bg-[#003366]/5 px-2 py-1 rounded-lg">
                                                {currentMultiplier}x
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Insufficient Balance Warning */}
                                {Number(amount) > balance && (
                                    <div className="bg-red-50 px-4 py-2 text-xs font-bold text-red-600 flex items-center justify-center gap-2">
                                        <AlertCircle size={14} /> Insufficient Wallet Balance
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handlePlaceBet}
                            disabled={!betNumber || !amount || Number(amount) > balance || placing || windowClosed}
                            className="w-full py-4 rounded-2xl bg-[#003366] text-white font-bold text-lg hover:bg-[#002855] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#003366]/20"
                        >
                            {windowClosed ? (
                                <>🔒 Betting Closed</>
                            ) : placing ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Place Bet <ArrowLeft className="rotate-180" size={18} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
