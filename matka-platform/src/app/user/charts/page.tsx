'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Trophy, Clock, Search, Calendar, ChevronDown, Check } from 'lucide-react';
import { GameResultCard } from '@/components/user/GameResultCard';
import { ResultsListCard } from '@/components/user/ResultsListCard';
import { formatTime12Hour } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

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
    status: 'declared' | 'upcoming';
}

export default function ResultsPage() {
    const [activeTab, setActiveTab] = useState<'declared' | 'upcoming'>('declared');
    const [results, setResults] = useState<GameResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState<'today' | 'yesterday'>('today');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                // Fetch declared results
                const endpoint = selectedDate === 'today' ? '/api/results/today' : '/api/results/today?date=yesterday';
                const res = await api.get<any[]>(endpoint);

                // Mocking upcoming results for now as API might not exist yet
                // In production, this should come from an endpoint like /api/games/upcoming
                const mockUpcoming = [
                    { id: 101, game_name: 'MILAN NIGHT', game_color: '#3B82F6', time: '09:00 PM', status: 'upcoming' },
                    { id: 102, game_name: 'RAJDHANI NIGHT', game_color: '#A855F7', time: '09:30 PM', status: 'upcoming' },
                    { id: 103, game_name: 'KALYAN NIGHT', game_color: '#F97316', time: '11:00 PM', status: 'upcoming' },
                    { id: 104, game_name: 'MAIN BAZAR', game_color: '#EF4444', time: '12:00 AM', status: 'upcoming' },
                ];

                if (activeTab === 'declared') {
                    if (res.success && Array.isArray(res.data)) {
                        const mappedResults: GameResult[] = res.data.map((item) => ({
                            id: item.game_id,
                            game_name: item.game_name,
                            game_color: item.color_code || '#003366',
                            open_panna: item.open?.panna || '***',
                            open_single: item.open?.single || '*',
                            close_panna: item.close?.panna || '***',
                            close_single: item.close?.single || '*',
                            jodi: item.close?.jodi || '**',
                            time: formatTime12Hour(item.open_time || ''),
                            status: 'declared',
                        }));
                        setResults(mappedResults);
                    } else {
                        setResults([]);
                    }
                } else {
                    // For upcoming, we should ideally filter games that haven't opened yet
                    // Using mock data for demonstration as requested
                    const upcoming: GameResult[] = mockUpcoming.map(item => ({
                        ...item,
                        open_panna: '', open_single: '', close_panna: '', close_single: '', jodi: '',
                        status: 'upcoming'
                    })) as GameResult[];
                    setResults(upcoming);
                }
            } catch (error) {
                console.error("Failed to fetch results:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [activeTab, selectedDate]);

    const filteredResults = results.filter(r =>
        r.game_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#003366] text-white shadow-lg pb-4 pt-4 px-4 rounded-b-3xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-black tracking-wide flex items-center gap-2">
                            <Trophy size={20} className="text-yellow-400" />
                            Results
                        </h1>
                        <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase ml-7">
                            Live & Upcoming
                        </p>
                    </div>
                    {/* Date Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold tracking-wide transition-all shadow-sm ${isDatePickerOpen ? 'bg-white text-[#003366]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            <Calendar size={14} className={isDatePickerOpen ? 'text-[#003366]' : 'text-white'} />
                            {selectedDate === 'today' ? 'Today' : 'Yesterday'}
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isDatePickerOpen ? 'rotate-180 text-[#003366]' : 'text-white/70'}`} />
                        </button>

                        <AnimatePresence>
                            {isDatePickerOpen && (
                                <>
                                    {/* Invisible Overlay to close on click outside */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsDatePickerOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden z-50 text-gray-800"
                                    >
                                        <div className="p-1.5 space-y-1">
                                            <button
                                                onClick={() => {
                                                    setSelectedDate('today');
                                                    setIsDatePickerOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${selectedDate === 'today'
                                                        ? 'bg-blue-50 text-[#003366]'
                                                        : 'hover:bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                <span>Today's Results</span>
                                                {selectedDate === 'today' && <Check size={16} className="text-[#003366]" />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedDate('yesterday');
                                                    setIsDatePickerOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${selectedDate === 'yesterday'
                                                        ? 'bg-blue-50 text-[#003366]'
                                                        : 'hover:bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                <span>Yesterday's Results</span>
                                                {selectedDate === 'yesterday' && <Check size={16} className="text-[#003366]" />}
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Toggle */}
                <div className="bg-[#002855] p-1 rounded-xl flex items-center relative">
                    <button
                        onClick={() => setActiveTab('declared')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 relative z-10 ${activeTab === 'declared' ? 'text-[#003366] bg-white shadow-md' : 'text-white/60 hover:text-white'
                            }`}
                    >
                        Results Declared
                    </button>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 relative z-10 ${activeTab === 'upcoming' ? 'text-[#003366] bg-white shadow-md' : 'text-white/60 hover:text-white'
                            }`}
                    >
                        Upcoming Results
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 mt-4 space-y-4">
                {/* Search (Optional but good for UX) */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search Game..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 font-medium placeholder:text-gray-400"
                    />
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : filteredResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No results found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredResults.map((result, i) => (
                                <motion.div
                                    key={result.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: i * 0.05 }}
                                >
                                    {activeTab === 'declared' ? (
                                        <ResultsListCard
                                            gameName={result.game_name}
                                            gameColor={result.game_color}
                                            openPanna={result.open_panna}
                                            openSingle={result.open_single}
                                            closePanna={result.close_panna}
                                            closeSingle={result.close_single}
                                            jodi={result.jodi}
                                            time={result.time}
                                        />
                                    ) : (
                                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-1.5 h-10 rounded-full"
                                                    style={{ backgroundColor: result.game_color }}
                                                />
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase">
                                                        {result.game_name}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Clock size={12} className="text-gray-400" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                                            Result at {result.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[#eff6ff] text-[#003366] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-[#003366]/10">
                                                Upcoming
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
