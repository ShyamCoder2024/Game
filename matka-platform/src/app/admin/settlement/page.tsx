'use client';

// src/app/admin/settlement/page.tsx
// Settlement dashboard — view and rollback past settlements

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatIndianCurrency } from '@/lib/utils';
import { useSocketStore } from '@/store/socketStore';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

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
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [grandTotal, setGrandTotal] = useState<Record<string, number>>({});
    const [rollbackTarget, setRollbackTarget] = useState<Settlement | null>(null);
    const [rollbackLoading, setRollbackLoading] = useState(false);

    const fetchData = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            // Correct endpoint: /api/admin/settlement/rollback-list
            const res = await api.get<Settlement[]>('/api/admin/settlement/rollback-list');
            if (res.success && res.data) {
                setData(res.data);
                setTotal(res.data.length);
                // Compute grand totals from data
                const totals = res.data.reduce((acc, s) => ({
                    total_bets: (acc.total_bets || 0) + (s.settlement?.total_bets || 0),
                    total_payout: (acc.total_payout || 0) + (s.settlement?.total_payout || 0),
                    net_pnl: (acc.net_pnl || 0) + (s.settlement?.net_pnl || 0),
                }), {} as Record<string, number>);
                setGrandTotal(totals);
            }
        } catch { /* graceful */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-refresh when settlement completes via WebSocket
    const lastSettlement = useSocketStore((s) => s.lastSettlement);
    useSocketEvent(lastSettlement, () => { fetchData(page); });

    const handleRollback = async () => {
        if (!rollbackTarget) return;
        setRollbackLoading(true);
        try {
            // Correct endpoint: POST /api/admin/settlement/rollback/:id
            await api.post(`/api/admin/settlement/rollback/${rollbackTarget.id}`);
            fetchData(page);
        } catch { /* graceful */ } finally {
            setRollbackLoading(false); setRollbackTarget(null);
        }
    };

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

            {data.length === 0 && !loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 py-16 text-center">
                    <AlertCircle size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-base font-medium text-slate-600">No settlements available for rollback</p>
                    <p className="text-sm text-slate-400 mt-1">Settlements will appear here after results are declared</p>
                </div>
            ) : (
                <DataTable title="Settlements" columns={columns} data={data} loading={loading}
                    totalItems={total} page={page}
                    onPageChange={(p) => { setPage(p); fetchData(p); }}
                    grandTotal={grandTotal} rowKey={(r) => r.id}
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
