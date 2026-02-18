'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CreateAccountDialog } from '@/components/leaders/CreateAccountDialog';
import { CoinTransferDialog } from '@/components/leaders/CoinTransferDialog';
import { api } from '@/lib/api';
import { UserCheck, Plus, Eye, Lock, Ban, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserRow {
    id: number;
    user_id: string;
    name: string;
    balance: number;
    deal_percentage: number;
    exposure: number;
    pnl: number;
    status: string;
}

export default function SMUsersPage() {
    const [data, setData] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [coinTarget, setCoinTarget] = useState<{ id: number; name: string; mode: 'credit' | 'debit' } | null>(null);
    const [blockTarget, setBlockTarget] = useState<{ id: string; name: string; status: string } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<UserRow[]>('/api/leaders', { role: 'user' });
            if (res.success && res.data) setData(res.data);
        } catch {
            setData([
                { id: 1, user_id: 'USR101', name: 'Player One', balance: 42000, deal_percentage: 50, exposure: 5000, pnl: 8500, status: 'active' },
                { id: 2, user_id: 'USR102', name: 'Player Two', balance: 18000, deal_percentage: 45, exposure: 3000, pnl: -2200, status: 'active' },
                { id: 3, user_id: 'USR103', name: 'Player Three', balance: 5500, deal_percentage: 40, exposure: 0, pnl: 0, status: 'blocked' },
            ]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleBlock = async () => {
        if (!blockTarget) return;
        try {
            await api.patch(`/api/leaders/${blockTarget.id}/status`, {
                status: blockTarget.status === 'active' ? 'blocked' : 'active',
            });
        } catch { /* handled */ }
        setBlockTarget(null);
        fetchData();
    };

    const columns: Column<UserRow>[] = [
        {
            key: 'user_id',
            label: 'User ID',
            render: (row: UserRow) => (
                <span className="font-semibold text-[#059669]">{row.user_id}</span>
            ),
        },
        { key: 'name', label: 'Name' },
        { key: 'balance', label: 'Balance', isCurrency: true },
        {
            key: 'deal_percentage',
            label: 'Deal %',
            render: (row: UserRow) => <span>{row.deal_percentage}%</span>,
        },
        { key: 'exposure', label: 'Exposure', isCurrency: true },
        {
            key: 'pnl',
            label: 'P/L',
            isCurrency: true,
            render: (row: UserRow) => (
                <span className={row.pnl >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {row.pnl >= 0 ? '↑' : '↓'} ₹{Math.abs(row.pnl).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: UserRow) => (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${row.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {row.status === 'active' ? 'Active' : 'Blocked'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: UserRow) => (
                <div className="flex items-center gap-1">
                    <button onClick={() => setCoinTarget({ id: row.id, name: row.name, mode: 'credit' })} className="w-7 h-7 rounded bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors" title="Credit">D</button>
                    <button onClick={() => setCoinTarget({ id: row.id, name: row.name, mode: 'debit' })} className="w-7 h-7 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors" title="Withdraw">W</button>
                    <button className="w-7 h-7 rounded bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors" title="View"><Eye size={14} className="mx-auto" /></button>
                    <button className="w-7 h-7 rounded bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors" title="Change Password"><Lock size={14} className="mx-auto" /></button>
                    <button onClick={() => setBlockTarget({ id: row.user_id, name: row.name, status: row.status })} className={`w-7 h-7 rounded text-white text-xs font-bold transition-colors ${row.status === 'active' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-emerald-500 hover:bg-emerald-600'}`} title={row.status === 'active' ? 'Block' : 'Unblock'}>
                        {row.status === 'active' ? <Ban size={14} className="mx-auto" /> : <CheckCircle2 size={14} className="mx-auto" />}
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <UserCheck className="text-[#059669]" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Users</h1>
                        <p className="text-sm text-gray-500">Manage users in your chain</p>
                    </div>
                </div>
                <Button onClick={() => setShowCreate(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9]">
                    <Plus size={16} className="mr-1" /> Create User
                </Button>
            </div>

            <DataTable title="Users" columns={columns} data={data} loading={loading} onSearch={() => { }} rowKey={(r) => r.id} />

            <CreateAccountDialog open={showCreate} onClose={() => setShowCreate(false)} onSuccess={fetchData} defaultRole="user" />
            {coinTarget && (
                <CoinTransferDialog open={!!coinTarget} onClose={() => setCoinTarget(null)} onSuccess={fetchData} userId={coinTarget.id} userName={coinTarget.name} type={coinTarget.mode} />
            )}
            <ConfirmDialog open={!!blockTarget} onClose={() => setBlockTarget(null)} onConfirm={handleBlock} title={blockTarget?.status === 'active' ? 'Block User' : 'Unblock User'} message={`Are you sure you want to ${blockTarget?.status === 'active' ? 'block' : 'unblock'} ${blockTarget?.name}?`} variant={blockTarget?.status === 'active' ? 'danger' : 'info'} confirmLabel={blockTarget?.status === 'active' ? 'Block' : 'Unblock'} />
        </div>
    );
}
