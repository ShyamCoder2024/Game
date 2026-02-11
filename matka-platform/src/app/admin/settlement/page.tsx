'use client';

// src/app/admin/settlement/page.tsx
// Settlement dashboard — view and rollback past settlements

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatIndianCurrency } from '@/lib/utils';
import { RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

interface Settlement {
    id: number; game_name: string; session: string; date: string;
    total_bets: number; total_amount: number; total_payout: number;
    net_pnl: number; status: string; settled_at: string;
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
            const res = await api.get<Settlement[]>('/api/admin/settlements', {
                page: String(p), limit: '20',
            });
            if (res.success && res.data) {
                setData(res.data);
                setTotal(res.pagination?.total || 0);
                setGrandTotal(res.grandTotal || {});
            }
        } catch { /* graceful */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRollback = async () => {
        if (!rollbackTarget) return;
        setRollbackLoading(true);
        try {
            await api.post(`/api/admin/settlements/${rollbackTarget.id}/rollback`);
            fetchData(page);
        } catch { /* graceful */ } finally {
            setRollbackLoading(false); setRollbackTarget(null);
        }
    };

    const columns: Column<Settlement>[] = [
        { key: 'game_name', label: 'Game', render: (r) => <span className="font-medium text-slate-700">{r.game_name}</span> },
        { key: 'session', label: 'Session', align: 'center', render: (r) => <Badge variant="outline" className="text-xs capitalize">{r.session}</Badge> },
        { key: 'date', label: 'Date', render: (r) => <span className="text-xs text-slate-500">{r.date}</span> },
        { key: 'total_bets', label: 'Bets', align: 'right', sortable: true, grandTotalKey: 'total_bets' },
        { key: 'total_amount', label: 'Volume', align: 'right', isCurrency: true, grandTotalKey: 'total_amount' },
        { key: 'total_payout', label: 'Payout', align: 'right', isCurrency: true, grandTotalKey: 'total_payout' },
        {
            key: 'net_pnl', label: 'Net P/L', align: 'right', sortable: true, grandTotalKey: 'net_pnl',
            render: (r) => (
                <span className={r.net_pnl >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {formatIndianCurrency(r.net_pnl)}
                </span>
            ),
        },
        {
            key: 'status', label: 'Status', align: 'center',
            render: (r) => (
                r.status === 'settled'
                    ? <Badge className="bg-green-100 text-green-700"><CheckCircle2 size={12} className="mr-1" />Settled</Badge>
                    : <Badge className="bg-red-100 text-red-700"><AlertCircle size={12} className="mr-1" />Rolled Back</Badge>
            ),
        },
        {
            key: 'actions', label: '', align: 'center',
            render: (r) => r.status === 'settled' ? (
                <button
                    onClick={() => setRollbackTarget(r)}
                    className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors"
                    title="Rollback"
                >
                    <RotateCcw size={16} />
                </button>
            ) : null,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Settlement</h1>
                <p className="text-sm text-slate-500 mt-1">View settlement history and perform rollbacks</p>
            </div>
            <DataTable title="Settlements" columns={columns} data={data} loading={loading}
                totalItems={total} page={page}
                onPageChange={(p) => { setPage(p); fetchData(p); }}
                grandTotal={grandTotal} rowKey={(r) => r.id}
            />
            <ConfirmDialog
                open={!!rollbackTarget}
                onClose={() => setRollbackTarget(null)}
                onConfirm={handleRollback}
                title={`Rollback settlement for ${rollbackTarget?.game_name}?`}
                message="This will reverse all payouts and restore bet statuses. This action is irreversible."
                confirmLabel="Rollback Settlement"
                variant="danger"
                loading={rollbackLoading}
            />
        </div>
    );
}
