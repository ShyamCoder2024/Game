'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Gamepad2, ChevronRight, AlertCircle, Coins, ArrowLeft, RefreshCw,
    CircleDot, Dice2, Copy, Crown, CheckCircle2,
    RectangleVertical, GalleryVertical, SunMedium, MoonStar
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSocketStore } from '@/store/socketStore';
import { useToastStore } from '@/store/toastStore';
import { formatTime12Hour } from '@/lib/utils';

// Define Bet Types constant based on schema
const BET_TYPES: Record<string, { name: string; shortName: string; defaultMultiplier: number; Icon: any; maxLength: number }> = {
    SINGLE_AKDA: { name: 'Single Digit', shortName: 'Single', defaultMultiplier: 9.5, Icon: CircleDot, maxLength: 1 },
    JODI: { name: 'Jodi', shortName: 'Jodi', defaultMultiplier: 95, Icon: Dice2, maxLength: 2 },
    SINGLE_PATTI: { name: 'Single Patti', shortName: 'SP', defaultMultiplier: 140, Icon: RectangleVertical, maxLength: 3 },
    DOUBLE_PATTI: { name: 'Double Patti', shortName: 'DP', defaultMultiplier: 280, Icon: Copy, maxLength: 3 },
    TRIPLE_PATTI: { name: 'Triple Patti', shortName: 'TP', defaultMultiplier: 600, Icon: GalleryVertical, maxLength: 3 },
};

interface Game {
    id: number;
    name: string;
    slug: string;
    open_time: string;
    close_time: string;
    status: 'open' | 'closed';
    color_code: string;
    color?: string; // Fallback for legacy support
}

interface BetHistoryItem {
    id: number;
    game_name: string;
    bet_type: string;
    bet_number: string;
    amount: number;
    win_amount: number;
    status: 'pending' | 'won' | 'lost';
    created_at: string;
    session: 'OPEN' | 'CLOSE';
}

export default function UserBetPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
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

    const [recentBets, setRecentBets] = useState<BetHistoryItem[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(true);

    // Time State (Initialize with current time)
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeLeft, setTimeLeft] = useState('00:00:00');

    // Store
    const liveBalance = useSocketStore((s) => s.liveBalance);
    const balance = liveBalance || 0;
    const { addToast } = useToastStore();

    // Clock Effect
    useEffect(() => {
        // Update time every second
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Helper to get time in IST
    const getISTTime = (date: Date) => {
        return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    };

    // Countdown Effect
    useEffect(() => {
        if (!selectedGame) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const istNow = getISTTime(now);

            // Determine target time string
            let targetTimeString = session === 'OPEN' ? selectedGame.open_time : selectedGame.close_time;
            if (!targetTimeString) return;

            // Parse target time string (Handle HH:mm or hh:mm A)
            let targetDate = new Date(istNow);
            let [time, modifier] = targetTimeString.split(' ');
            let [hours, minutes] = time.split(':');

            let h = parseInt(hours, 10);
            const m = parseInt(minutes, 10);

            if (modifier) {
                // 12-hour format
                if (modifier === 'PM' && h < 12) h += 12;
                if (modifier === 'AM' && h === 12) h = 0;
            }

            targetDate.setHours(h, m, 0, 0);

            // If target time is past, show 00:00:00 or handle next day logic if needed
            // For now, if past, just show 00:00:00
            let diff = targetDate.getTime() - istNow.getTime();

            if (diff < 0) {
                setTimeLeft('00:00:00');
                return;
            }

            // Format diff
            const hh = Math.floor(diff / (1000 * 60 * 60));
            const mm = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const ss = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(
                `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
            );
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Immediate call

        return () => clearInterval(timer);
    }, [selectedGame, session, currentTime]); // Re-run on session/game change or each tick if needed (optimized to use interval)

    // Format Helpers
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

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

    // Fetch recent bets
    const fetchRecentBets = async () => {
        try {
            const res = await api.get<BetHistoryItem[]>('/api/bets/my-bets/today');
            if (res.success && Array.isArray(res.data)) {
                setRecentBets(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch recent bets:', error);
        } finally {
            setLoadingRecent(false);
        }
    };

    useEffect(() => {
        fetchRecentBets();
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
                addToast('Bet placed successfully!', 'success');
                setStep(1);
                setBetNumber('');
                setAmount('');
                setSelectedBetType(null);
                setSelectedGame(null);
                fetchRecentBets(); // Refresh recent bets
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
            {/* Header (Non-sticky as requested) */}
            <div className="relative mb-4 px-4 pt-2 bg-[#F5F7FA]">
                {!selectedGame ? (
                    // Default Header for Game List
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div>
                            <h1 className="text-xl font-black text-[#003366] flex items-center gap-2 tracking-tight">
                                <span className="bg-[#E6F0FF] p-1.5 rounded-lg text-[#003366]">
                                    <Gamepad2 size={20} />
                                </span>
                                Place Bet
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mt-1 ml-1">
                                Select Game
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                            <Coins size={14} className="text-amber-500" />
                            <span className="text-sm font-bold text-amber-900">₹{balance.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                ) : (
                    // Detailed Header for Selected Game (Reference Style)
                    <div className="rounded-t-lg overflow-hidden shadow-md">
                        {/* Main Info Card */}
                        <div className="flex text-white transition-colors duration-300" style={{ backgroundColor: selectedGame.color_code || '#483D8B' }}>
                            {/* Left Info Section */}
                            <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 border-r border-white/20">
                                <h2 className="text-sm font-bold uppercase tracking-wide mb-0.5">matka</h2>
                                <h1 className="text-lg font-black uppercase tracking-wider mb-2 text-center leading-none">
                                    {selectedGame.name} {session}
                                </h1>

                                <div className="space-y-0.5 w-full text-center">
                                    <div className="flex items-center justify-center gap-2 text-xs font-medium border-t border-white/10 pt-1">
                                        <span className="opacity-80">Bazar Date :</span>
                                        <span>{formatDate(currentTime)}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs font-medium border-t border-white/10 pt-1">
                                        <span className="opacity-80">Bazar Time :</span>
                                        <span>{formatTime12Hour(selectedGame.open_time)} - {formatTime12Hour(selectedGame.close_time)}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs font-medium border-t border-white/10 pt-1">
                                        <span className="opacity-80">Current Time :</span>
                                        <span className="font-bold">{formatTime(currentTime)}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold border-t border-white/10 pt-1 text-red-50">
                                        <span>Bazar Left Time :</span>
                                        <span>{timeLeft}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Refresh Section */}
                            <div
                                className="w-16 flex items-center justify-center transition-opacity hover:opacity-90 cursor-pointer"
                                style={{ backgroundColor: selectedGame.color_code || '#483D8B' }}
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw size={24} className="animate-pulse" />
                            </div>
                        </div>

                        {/* Market Closed Banner */}
                        {(windowClosed || selectedGame.status === 'closed') && (
                            <div className="bg-white py-4 text-center border-x border-b border-gray-200">
                                <span className="text-lg text-gray-600 font-medium">Market Closed</span>
                            </div>
                        )}

                        {/* Balance Strip */}
                        <div className="bg-[#003366] text-white py-1 px-3 flex justify-between items-center text-xs font-bold">
                            <span>Balance</span>
                            <span className="text-amber-400">₹{balance.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                )}
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
                                                    <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: game.color_code || game.color }} />
                                                    <div className="text-left">
                                                        <h3 className="text-lg font-black text-[#003366] leading-none mb-1.5">
                                                            {game.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            <span>Open: {formatTime12Hour(game.open_time)}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                            <span>Close: {formatTime12Hour(game.close_time)}</span>
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

                        {/* Recent Bets Section */}
                        <div className="mt-8">
                            <h3 className="text-lg font-black text-[#003366] mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-[#003366] rounded-full" />
                                Today's Bets
                            </h3>

                            {loadingRecent ? (
                                <div className="space-y-3">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : recentBets.length === 0 ? (
                                <div className="text-center py-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-gray-400 text-sm font-medium">No bets placed today yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentBets.map((bet) => (
                                        <div key={bet.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                                            <div className={`absolute top-0 left-0 w-1 h-full ${bet.status === 'won' ? 'bg-emerald-500' :
                                                bet.status === 'lost' ? 'bg-red-500' :
                                                    'bg-amber-400'
                                                }`} />

                                            <div className="flex justify-between items-start mb-2 pl-2">
                                                <div>
                                                    <h4 className="font-bold text-[#003366] text-sm">{bet.game_name}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 uppercase tracking-wider">
                                                            {bet.session}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {new Date(bet.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${bet.status === 'won' ? 'bg-emerald-50 text-emerald-600' :
                                                    bet.status === 'lost' ? 'bg-red-50 text-red-600' :
                                                        'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {bet.status}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-2 pl-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Bet Number</span>
                                                    <span className="text-lg font-black text-gray-800 tracking-widest">{bet.bet_number}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Amount</span>
                                                    <span className="text-sm font-bold text-[#003366]">₹{bet.amount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Select Bet Type */}
                {step === 2 && selectedGame && (
                    <div className="space-y-4 animate-in slide-in-from-right-10 duration-300">
                        <button
                            onClick={() => router.push('/user')}
                            className="text-xs font-bold text-gray-400 hover:text-[#003366] flex items-center gap-1 transition-colors pl-1"
                        >
                            <ArrowLeft size={14} /> Back to Games
                        </button>

                        <div className="h-2" />

                        <div className="grid grid-cols-2 gap-3 pb-20">
                            {betTypeEntries.map(([key, type]) => {
                                const isTriplePatti = key === 'TRIPLE_PATTI';
                                const dynamicColor = selectedGame.color_code || selectedGame.color || '#483D8B';
                                const IconComponent = type.Icon || Gamepad2; // Fallback icon

                                return (
                                    <button
                                        key={key}
                                        onClick={() => { setSelectedBetType(key); setStep(3); }}
                                        className={`relative group cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${isTriplePatti ? 'col-span-2' : ''
                                            }`}
                                    >
                                        <div
                                            className={`h-full p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 bg-white shadow-sm hover:shadow-md border-transparent hover:border-gray-100`}
                                            style={{
                                                borderColor: 'transparent',
                                                // Hover border color handled via style
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = dynamicColor;
                                                e.currentTarget.style.backgroundColor = `${dynamicColor}10`; // 10% opacity hex
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'transparent';
                                                e.currentTarget.style.backgroundColor = 'white';
                                            }}
                                        >
                                            {/* Icon Circle */}
                                            <div
                                                className="p-3 rounded-full transition-colors duration-300"
                                                style={{
                                                    backgroundColor: `${dynamicColor}15`,
                                                    color: dynamicColor,
                                                }}
                                            >
                                                <IconComponent size={24} strokeWidth={2.5} />
                                            </div>

                                            {/* Text Content */}
                                            <div className="text-center">
                                                <h3 className="font-bold text-gray-800 text-sm mb-0.5">{type.name}</h3>
                                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{type.shortName}</p>
                                            </div>

                                            {/* Multiplier Badge */}
                                            <div
                                                className="px-2.5 py-1 rounded-md text-xs font-black tracking-wide"
                                                style={{
                                                    backgroundColor: `${dynamicColor}15`,
                                                    color: dynamicColor,
                                                }}
                                            >
                                                {type.defaultMultiplier}x
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
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
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSession('OPEN')}
                                            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black tracking-wide transition-all border-2 ${session === 'OPEN'
                                                ? 'bg-[#003366] text-white border-[#003366] shadow-lg shadow-[#003366]/20 transform scale-[1.02]'
                                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <SunMedium size={18} strokeWidth={2.5} className={session === 'OPEN' ? "text-amber-400" : "text-gray-300"} />
                                            OPEN
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSession('CLOSE')}
                                            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black tracking-wide transition-all border-2 ${session === 'CLOSE'
                                                ? 'bg-[#003366] text-white border-[#003366] shadow-lg shadow-[#003366]/20 transform scale-[1.02]'
                                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <MoonStar size={18} strokeWidth={2.5} className={session === 'CLOSE' ? "text-indigo-300" : "text-gray-300"} />
                                            CLOSE
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
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= BET_TYPES[selectedBetType].maxLength) {
                                                setBetNumber(val);
                                            }
                                        }}
                                        placeholder={"0".repeat(BET_TYPES[selectedBetType].maxLength)}
                                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-center text-3xl font-black tracking-[0.5em] text-[#003366] placeholder:text-gray-300 focus:border-[#003366] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#003366]/5 transition-all"
                                        maxLength={BET_TYPES[selectedBetType].maxLength}
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
