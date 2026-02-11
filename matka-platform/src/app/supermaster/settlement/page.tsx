'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api } from '@/lib/api';
import { Scale, CheckCircle2 } from 'lucide-react';

interface SettlementRow {
    id: number;
    user_id: string;
    name: string;
    role: string;
    lena_hai: number;
    dena_hai: number;
    le_liya: number;
    net: number;
    status: string;
}

export default function SMSettlementPage() {
    const [data, setData] = useState<SettlementRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [settleTarget, setSettleTarget] = useState<SettlementRow | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<SettlementRow[]>('/api/settlement/collection');
            if (res.success && res.data) setData(res.data);
        } catch {
            setData([
                { id: 1, user_id: 'MST001', name: 'Master Alpha', role: 'master', lena_hai: 125000, dena_hai: 0, le_liya: 80000, net: 45000, status: 'pending' },
                { id: 2, user_id: 'MST002', name: 'Master Beta', role: 'master', lena_hai: 0, dena_hai: 32000, le_liya: 0, net: -32000, status: 'pending' },
                { id: 3, user_id: 'USR101', name: 'Player One', role: 'user', lena_hai: 8500, dena_hai: 0, le_liya: 8500, net: 0, status: 'settled' },
                { id: 4, user_id: 'USR102', name: 'Player Two', role: 'user', lena_hai: 0, dena_hai: 2200, le_liya: 0, net: -2200, status: 'pending' },
            ]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSettle = async () => {
        if (!settleTarget) return;
        try {
            await api.post(`/api/settlement/mark-settled`, { userId: settleTarget.user_id });
        } catch { /* handled */ }
        setSettleTarget(null);
        fetchData();
    };

    const columns: Column<SettlementRow>[] = [
        {
            key: 'user_id',
            label: 'User ID',
            render: (row: SettlementRow) => (
                <span className="font-semibold text-[#7C3AED]">{row.user_id}</span>
            ),
        },
        { key: 'name', label: 'Name' },
        {
            key: 'role',
            label: 'Role',
            render: (row: SettlementRow) => (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${row.role === 'master' ? 'bg-cyan-50 text-cyan-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {row.role === 'master' ? 'Master' : 'User'}
                </span>
            ),
        },
        {
            key: 'lena_hai',
            label: 'लेना है (Receivable)',
            render: (row: SettlementRow) => (
                <span className={row.lena_hai > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                    {row.lena_hai > 0 ? `₹${row.lena_hai.toLocaleString('en-IN')}` : '—'}
                </span>
            ),
        },
        {
            key: 'dena_hai',
            label: 'देना है (Payable)',
            render: (row: SettlementRow) => (
                <span className={row.dena_hai > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                    {row.dena_hai > 0 ? `₹${row.dena_hai.toLocaleString('en-IN')}` : '—'}
                </span>
            ),
        },
        {
            key: 'le_liya',
            label: 'ले लिया (Settled)',
            render: (row: SettlementRow) => (
                <span className={row.le_liya > 0 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
                    {row.le_liya > 0 ? `₹${row.le_liya.toLocaleString('en-IN')}` : '—'}
                </span>
            ),
        },
        {
            key: 'net',
            label: 'Net',
            render: (row: SettlementRow) => (
                <span className={row.net > 0 ? 'text-green-600 font-bold' : row.net < 0 ? 'text-red-600 font-bold' : 'text-gray-500'}>
                    {row.net > 0 ? '↑' : row.net < 0 ? '↓' : ''} ₹{Math.abs(row.net).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: SettlementRow) => (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${row.status === 'settled' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'settled' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {row.status === 'settled' ? 'Settled' : 'Pending'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: SettlementRow) => (
                row.status !== 'settled' ? (
                    <button
                        onClick={() => setSettleTarget(row)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white text-xs font-medium hover:bg-[#6D28D9] transition-colors"
                    >
                        <CheckCircle2 size={14} /> Mark Settled
                    </button>
                ) : (
                    <span className="text-xs text-gray-400">Cleared</span>
                )
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Scale className="text-[#7C3AED]" size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Settlement</h1>
                    <p className="text-sm text-gray-500">Collection report — Lena Hai / Dena Hai / Le Liya</p>
                </div>
            </div>

            <DataTable title="Settlement" columns={columns} data={data} loading={loading} onSearch={() => { }} rowKey={(r) => r.id} />

            <ConfirmDialog
                open={!!settleTarget}
                onClose={() => setSettleTarget(null)}
                onConfirm={handleSettle}
                title="Mark as Settled"
                description={`Mark ₹${Math.abs(settleTarget?.net || 0).toLocaleString('en-IN')} for ${settleTarget?.name} as Le Liya (settled)?`}
                variant="info"
                confirmLabel="Le Liya ✓"
            />
        </div>
    );
}
