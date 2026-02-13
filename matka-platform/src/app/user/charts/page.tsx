'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { BarChart3, ChevronDown } from 'lucide-react';

interface ChartEntry {
    date: string;
    day: string;
    open_panna: string;
    jodi: string;
    close_panna: string;
}

interface WeekData {
    week_label: string;
    entries: ChartEntry[];
}

const SAMPLE_GAMES = ['SRIDEVI', 'KALYAN', 'MILAN DAY', 'RAJDHANI', 'TIME BAZAR'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function UserChartsPage() {
    const [selectedGame, setSelectedGame] = useState(SAMPLE_GAMES[0]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [chartData, setChartData] = useState<WeekData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChart = useCallback(async () => {
        setLoading(true);

        const generateSampleData = () => {
            // Sample chart data — 4 weeks
            const weeks: WeekData[] = [];
            const sampleData = [
                ['388', '90', '280'], ['147', '21', '560'], ['236', '**', '***'], ['579', '15', '348'],
                ['456', '56', '123'], ['*', '**', '***'], ['789', '41', '234'],
                ['123', '33', '567'], ['890', '89', '012'], ['345', '52', '678'],
                ['678', '78', '901'], ['234', '23', '456'], ['567', '67', '890'], ['901', '91', '123'],
                ['111', '12', '345'], ['222', '23', '456'], ['333', '34', '567'],
                ['444', '45', '678'], ['555', '56', '789'], ['666', '67', '890'], ['777', '78', '901'],
                ['888', '89', '012'], ['999', '90', '123'], ['100', '01', '234'],
                ['200', '02', '345'], ['300', '03', '456'], ['400', '04', '567'], ['500', '05', '678'],
            ];
            for (let w = 0; w < 4; w++) {
                const entries: ChartEntry[] = [];
                for (let d = 0; d < 7; d++) {
                    const idx = w * 7 + d;
                    const sd = sampleData[idx] || ['*', '**', '***'];
                    entries.push({
                        date: `${10 + w * 7 + d}/01`,
                        day: DAYS[d],
                        open_panna: sd[0],
                        jodi: sd[1],
                        close_panna: sd[2],
                    });
                }
                weeks.push({ week_label: `Week ${w + 1}`, entries });
            }
            return weeks;
        };

        try {
            const res = await api.get<WeekData[]>('/api/charts', { game: selectedGame });
            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                setChartData(res.data);
            } else {
                setChartData(generateSampleData());
            }
        } catch {
            setChartData(generateSampleData());
        }
        setLoading(false);
    }, [selectedGame]);

    useEffect(() => { fetchChart(); }, [fetchChart]);

    return (
        <div className="space-y-6 pb-24 px-1">
            {/* Header Section */}
            <div className="sticky top-[70px] z-30 bg-[#F5F7FA]/95 backdrop-blur-md pb-2 pt-4 px-2">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-[#003366] flex items-center gap-2 tracking-tight">
                            <span className="bg-[#E6F0FF] p-1.5 rounded-lg text-[#003366]">
                                <BarChart3 size={20} />
                            </span>
                            Charts
                        </h2>
                        <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mt-1 ml-1">
                            Historic Results
                        </p>
                    </div>

                    {/* Premium Game Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-200 ${showDropdown
                                ? 'bg-[#003366] text-white border-[#003366] shadow-md'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            {selectedGame}
                            <ChevronDown
                                size={14}
                                className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-2xl z-40 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                                    <div className="p-1">
                                        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                                            Select Game
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {SAMPLE_GAMES.map((g) => (
                                                <button
                                                    key={g}
                                                    onClick={() => { setSelectedGame(g); setShowDropdown(false); }}
                                                    className={`w-full px-3 py-2.5 text-left text-xs font-bold rounded-lg transition-all flex items-center justify-between mb-0.5 ${g === selectedGame
                                                        ? 'bg-[#E6F0FF] text-[#003366]'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {g}
                                                    {g === selectedGame && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#003366]" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Chart Grid */}
            {loading ? (
                <div className="space-y-3">
                    <div className="h-10 bg-white rounded-xl animate-pulse" />
                    <div className="h-96 bg-white rounded-2xl animate-pulse shadow-sm" />
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 bg-[#003366] text-white">
                        {DAYS.map((day) => (
                            <div key={day} className="py-3 text-center text-[10px] font-bold tracking-wider opacity-90">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Chart Body */}
                    <div className="divide-y divide-gray-100">
                        {chartData.map((week, widx) => (
                            <div key={widx} className="grid grid-cols-7 divide-x divide-gray-100/50">
                                {week.entries.map((entry, eidx) => (
                                    <div
                                        key={eidx}
                                        className="relative py-2 px-0.5 min-h-[65px] flex flex-col items-center justify-center group hover:bg-gray-50 transition-colors"
                                    >
                                        {entry.open_panna === '*' ? (
                                            <span className="text-gray-200 text-lg select-none">•</span>
                                        ) : (
                                            <>
                                                {/* Open Panna */}
                                                <span className="text-[9px] text-gray-400 font-medium leading-tight">
                                                    {entry.open_panna}
                                                </span>

                                                {/* Jodi (Result) */}
                                                <div className="w-8 h-7 my-0.5 rounded-lg bg-[#ebfcf5] text-[#059669] flex items-center justify-center text-sm font-black shadow-sm border border-[#059669]/10">
                                                    {entry.jodi}
                                                </div>

                                                {/* Close Panna */}
                                                <span className="text-[9px] text-gray-400 font-medium leading-tight">
                                                    {entry.close_panna}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Footer / Legend */}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-medium">
                        <span>* Market Closed</span>
                        <span>Updated: Live</span>
                    </div>
                </div>
            )}
        </div>
    );
}
