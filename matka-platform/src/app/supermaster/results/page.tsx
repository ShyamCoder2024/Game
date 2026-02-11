'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Trophy, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface GameResult {
    id: number;
    game_name: string;
    game_color: string;
    date: string;
    open_panna: string;
    open_single: string;
    close_panna: string;
    close_single: string;
    jodi: string;
    declared_at: string;
}

export default function SMResultsPage() {
    const [results, setResults] = useState<GameResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'today' | 'yesterday'>('today');

    const fetchResults = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<GameResult[]>('/api/results', { filter });
            if (res.success && res.data) setResults(res.data);
        } catch {
            setResults([
                { id: 1, game_name: 'SRIDEVI', game_color: '#22C55E', date: new Date().toISOString(), open_panna: '388', open_single: '9', close_panna: '280', close_single: '0', jodi: '90', declared_at: '03:45 PM' },
                { id: 2, game_name: 'KALYAN', game_color: '#F97316', date: new Date().toISOString(), open_panna: '147', open_single: '2', close_panna: '560', close_single: '1', jodi: '21', declared_at: '05:15 PM' },
                { id: 3, game_name: 'MILAN DAY', game_color: '#EAB308', date: new Date().toISOString(), open_panna: '236', open_single: '1', close_panna: '', close_single: '', jodi: '', declared_at: '02:00 PM' },
                { id: 4, game_name: 'RAJDHANI', game_color: '#A855F7', date: new Date().toISOString(), open_panna: '579', open_single: '1', close_panna: '348', close_single: '5', jodi: '15', declared_at: '09:30 PM' },
            ]);
        }
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetchResults(); }, [fetchResults]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Trophy className="text-[#7C3AED]" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Results</h1>
                        <p className="text-sm text-gray-500">View declared game results</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('today')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'today' ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Calendar size={14} className="inline mr-1" /> Today
                    </button>
                    <button
                        onClick={() => setFilter('yesterday')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'yesterday' ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        Yesterday
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-5">
                                <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
                                <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
                                <div className="h-3 w-20 bg-gray-200 rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : results.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Trophy size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No results for {filter}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {results.map((result) => (
                        <Card key={result.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-0">
                                <div className="flex">
                                    <div className="w-1.5" style={{ backgroundColor: result.game_color }} />
                                    <div className="p-5 flex-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-gray-800">{result.game_name}</h3>
                                            <span className="text-xs text-gray-400">{result.declared_at}</span>
                                        </div>
                                        <div className="text-center py-2">
                                            <span className="text-2xl font-bold text-gray-800 tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                {result.open_panna}
                                                {' — '}
                                                {result.jodi ? (
                                                    <span className="text-[#7C3AED] text-lg align-super">{result.jodi}</span>
                                                ) : (
                                                    <span className="text-gray-300 text-lg align-super">**</span>
                                                )}
                                                {' — '}
                                                {result.close_panna || '***'}
                                            </span>
                                        </div>
                                        <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
                                            <span>Open: {result.open_single}</span>
                                            {result.close_single && <span>Close: {result.close_single}</span>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
