'use client';

// src/app/admin/settlement/page.tsx
// B12: Added game name search, date filter, and session filter to settlement page

import { useEffect, useState, useCallback, useMemo } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatIndianCurrency } from '@/lib/utils';
import { useSocketStore } from '@/store/socketStore';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { RotateCcw, CheckCircle2, AlertCircle, Search, Filter, X } from 'lucide-react';

interface Settlement {
    id: number;
    game_id: number;
    date: string;
    session: string;
    game: { name: string };
    settlement: {
        id: number;
        total_bets: number;
        total_payout: number;
        net_pnl: number;
    };
    open_panna?: string | null;
    close_panna?: string | null;
}

export default function SettlementPage() {
    const [data, setData] = useState<Settlement[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rollbackTarget, setRollbackTarget] = useState<Settlement | null>(null);
    const [rollbackLoading, setRollbackLoading] = useState(false);

    // B12: Filter state
    const [searchGame, setSearchGame] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterSession, setFilterSession] = useState<'' | 'open' | 'close'>('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<Settlement[]>('/api/admin/settlement/rollback-list');
            if (res.success && res.data) {
                setData(res.data);
            }
        } catch { /* graceful */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-refresh when settlement completes via WebSocket
    const lastSettlement = useSocketStore((s) => s.lastSettlement);
    useSocketEvent(lastSettlement, () => { fetchData(); });

    const handleRollback = async () => {
        if (!rollbackTarget) return;
        setRollbackLoading(true);
        try {
            await api.post(`/api/admin/settlement/rollback/${rollbackTarget.id}`);
            fetchData();
        } catch { /* graceful */ } finally {
            setRollbackLoading(false); setRollbackTarget(null);
        }
    };

    // B12: Client-side filtering
    const filtered = useMemo(() => {
        return data.filter((s) => {
            const gameName = s.game?.name?.toLowerCase() || '';
            if (searchGame && !gameName.includes(searchGame.toLowerCase())) return false;
            if (filterDate && s.date !== filterDate) return false;
            if (filterSession && s.session !== filterSession) return false;
            return true;
        });
    }, [data, searchGame, filterDate, filterSession]);

    // Grand totals from filtered data
    const grandTotal = useMemo(() => {
        return filtered.reduce((acc, s) => ({
            total_bets: (acc.total_bets || 0) + (s.settlement?.total_bets || 0),
            total_payout: (acc.total_payout || 0) + (s.settlement?.total_payout || 0),
            net_pnl: (acc.net_pnl || 0) + (s.settlement?.net_pnl || 0),
        }), {} as Record<string, number>);
    }, [filtered]);

    const hasFilters = searchGame || filterDate || filterSession;
    const clearFilters = () => { setSearchGame(''); setFilterDate(''); setFilterSession(''); };

    const columns: Column<Settlement>[] = [
        {
            key: 'game_id', label: 'Game',
            render: (r) => <span className="font-medium text-slate-700">{r.game?.name || '—'}</span>
        },
        {
            key: 'session', label: 'Session', align: 'center',
            render: (r) => <Badge variant="outline" className="text-xs capitalize">{r.session}</Badge>
        },
        {
            key: 'date', label: 'Date',
            render: (r) => <span className="text-xs text-slate-500">{r.date}</span>
        },
        {
            key: 'settlement', label: 'Bets', align: 'right',
            render: (r) => <span>{r.settlement?.total_bets ?? 0}</span>
        },
        {
            key: 'settlement', label: 'Payout', align: 'right',
            render: (r) => <span>{formatIndianCurrency(r.settlement?.total_payout ?? 0)}</span>
        },
        {
            key: 'settlement', label: 'Net P/L', align: 'right',
            render: (r) => (
                <span className={(r.settlement?.net_pnl ?? 0) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {formatIndianCurrency(r.settlement?.net_pnl ?? 0)}
                </span>
            ),
        },
        {
            key: 'id', label: 'Status', align: 'center',
            render: () => (
                <Badge className="bg-green-100 text-green-700"><CheckCircle2 size={12} className="mr-1" />Settled</Badge>
            ),
        },
        {
            key: 'id', label: '', align: 'center',
            render: (r) => (
                <button
                    onClick={() => setRollbackTarget(r)}
                    className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors"
                    title="Rollback"
                >
                    <RotateCcw size={16} />
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Settlement</h1>
                <p className="text-sm text-slate-500 mt-1">View settlement history and perform rollbacks</p>
            </div>

            {/* B12: Filter bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={15} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Filter Settlements</span>
                    {hasFilters && (
                        <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={13} />Clear filters
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Game name search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search game name..."
                            value={searchGame}
                            onChange={(e) => setSearchGame(e.target.value)}
                            className="pl-8 bg-slate-50 text-sm h-9"
                        />
                    </div>
                    {/* Date filter */}
                    <Input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-slate-50 text-sm h-9"
                    />
                    {/* Session filter */}
                    <select
                        value={filterSession}
                        onChange={(e) => setFilterSession(e.target.value as '' | 'open' | 'close')}
                        className="h-9 rounded-md border border-input bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">All Sessions</option>
                        <option value="open">Open</option>
                        <option value="close">Close</option>
                    </select>
                </div>
                {hasFilters && (
                    <p className="text-xs text-slate-400 mt-2">
                        Showing {filtered.length} of {data.length} settlements
                    </p>
                )}
            </div>

            {filtered.length === 0 && !loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 py-16 text-center">
                    <AlertCircle size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-base font-medium text-slate-600">
                        {hasFilters ? 'No settlements match your filters' : 'No settlements available for rollback'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        {hasFilters ? 'Try adjusting your search criteria' : 'Settlements will appear here after results are declared'}
                    </p>
                </div>
            ) : (
                <DataTable
                    title="Settlements"
                    columns={columns}
                    data={filtered}
                    loading={loading}
                    totalItems={filtered.length}
                    page={page}
                    onPageChange={(p) => setPage(p)}
                    grandTotal={grandTotal}
                    rowKey={(r) => r.id}
                />
            )}

            <ConfirmDialog
                open={!!rollbackTarget}
                onClose={() => setRollbackTarget(null)}
                onConfirm={handleRollback}
                title={`Rollback settlement for ${rollbackTarget?.game?.name}?`}
                message="This will reverse all payouts and restore bet statuses. This action cannot be undone."
                confirmLabel="Rollback Settlement"
                variant="danger"
                loading={rollbackLoading}
            />
        </div>
    );
}
