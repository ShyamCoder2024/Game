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
        try {
            const res = await api.get<WeekData[]>('/api/charts', { game: selectedGame });
            if (res.success && res.data) setChartData(res.data);
        } catch {
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
            setChartData(weeks);
        }
        setLoading(false);
    }, [selectedGame]);

    useEffect(() => { fetchChart(); }, [fetchChart]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 size={20} className="text-[#059669]" /> Charts
                </h2>
                {/* Game Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    >
                        {selectedGame}
                        <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showDropdown && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden min-w-[160px]">
                            {SAMPLE_GAMES.map((g) => (
                                <button
                                    key={g}
                                    onClick={() => { setSelectedGame(g); setShowDropdown(false); }}
                                    className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-emerald-50 transition-colors ${g === selectedGame ? 'text-[#059669] bg-emerald-50' : 'text-gray-700'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chart Grid */}
            {loading ? (
                <div className="h-64 bg-white rounded-xl animate-pulse" />
            ) : (
                <div className="bg-white rounded-xl overflow-hidden">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200">
                        {DAYS.map((day) => (
                            <div key={day} className="py-2 text-center text-[10px] font-bold text-gray-500 bg-gray-50">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Week Rows */}
                    {chartData.map((week, widx) => (
                        <div key={widx}>
                            <div className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
                                {week.entries.map((entry, eidx) => (
                                    <div
                                        key={eidx}
                                        className="py-2 px-1 text-center border-r border-gray-100 last:border-r-0 min-h-[60px] flex flex-col items-center justify-center"
                                    >
                                        {entry.open_panna === '*' ? (
                                            <span className="text-gray-300 text-xs">✱</span>
                                        ) : (
                                            <>
                                                <span className="text-[9px] text-gray-500 font-medium">{entry.open_panna}</span>
                                                <span className="text-xs font-extrabold text-[#059669] my-0.5">{entry.jodi}</span>
                                                <span className="text-[9px] text-gray-500 font-medium">{entry.close_panna}</span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
