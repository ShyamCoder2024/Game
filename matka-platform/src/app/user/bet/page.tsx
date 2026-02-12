'use client';

import { useState, useEffect } from 'react';
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
    // State
    const [loading, setLoading] = useState(true);
    const [games, setGames] = useState<Game[]>([]);
    const [step, setStep] = useState(1);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [selectedBetType, setSelectedBetType] = useState<string | null>(null);
    const [number, setNumber] = useState('');
    const [amount, setAmount] = useState('');
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
            } catch (error) {
                console.error('Failed to fetch games', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, []);

    const handlePlaceBet = async () => {
        if (!selectedGame || !selectedBetType || !number || !amount) return;

        setPlacing(true);
        try {
            const res = await api.post('/api/bets/place', {
                game_id: selectedGame.id,
                bet_type: selectedBetType,
                number: number,
                amount: Number(amount)
            });

            if (res.success) {
                addToast('Bet placed successfully!', 'success');
                setStep(1);
                setNumber('');
                setAmount('');
                setSelectedBetType(null);
                setSelectedGame(null);
            } else {
                addToast(res.error?.message || 'Failed to place bet', 'error');
            }
        } catch (error) {
            addToast('Network error occurred', 'error');
        } finally {
            setPlacing(false);
        }
    };

    const betTypeEntries = Object.entries(BET_TYPES);
    const currentMultiplier = selectedBetType ? BET_TYPES[selectedBetType].defaultMultiplier : 0;
    const potentialWin = Number(amount) * currentMultiplier;

    return (
        <div className="container mx-auto p-4 max-w-lg mb-24">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Place Bet</h1>

            {/* Step 1: Select Game */}
            {step === 1 && (
                <div className="space-y-3">
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
                            ))}
                        </div>
                    ) : games.length === 0 ? (
                        <div className="bg-white rounded-xl py-12 text-center">
                            <Gamepad2 size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No games available</p>
                            <p className="text-xs text-gray-400 mt-1">Please check back later</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {games.map((game) => (
                                <button
                                    key={game.id}
                                    disabled={game.status === 'closed'}
                                    onClick={() => { setSelectedGame(game); setStep(2); setWindowClosed(false); }}
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
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setStep(1)} className="text-sm text-[#059669] font-semibold flex items-center">
                            <ArrowLeft size={16} className="mr-1" /> Back
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800">{selectedGame.name}</h2>
                        <span className="text-xs text-slate-500">Select Bet Type</span>
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
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setStep(2)} className="text-sm text-[#059669] font-semibold flex items-center">
                            <ArrowLeft size={16} className="mr-1" /> Back
                        </button>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">{BET_TYPES[selectedBetType].name}</h2>

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
                                <span className="font-bold text-[#059669]">{currentMultiplier}x</span>
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
                        disabled={!number || !amount || Number(amount) > balance || placing || windowClosed}
                        className="w-full py-4 rounded-xl bg-[#059669] text-white font-bold text-lg hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Coins size={20} />
                        {windowClosed ? '🔒 Betting Closed' : placing ? 'Placing...' : 'Place Bet'}
                    </button>
                </div>
            )}
        </div>
    );
}
