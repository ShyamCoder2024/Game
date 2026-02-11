'use client';

// src/app/admin/clients/page.tsx
// Client management — create, coin ops, block/unblock

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { CreateAccountDialog } from '@/components/leaders/CreateAccountDialog';
import { CoinTransferDialog } from '@/components/leaders/CoinTransferDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
    UserPlus, ArrowUpCircle, ArrowDownCircle,
    ShieldOff, Shield, Eye,
} from 'lucide-react';

interface Client {
    id: number; user_id: string; name: string; role: string;
    balance: number; exposure: number; deal_percentage: number;
    is_blocked: boolean; parent_user_id: string;
}

export default function ClientsPage() {
    const [data, setData] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [grandTotal, setGrandTotal] = useState<Record<string, number>>({});
    const [createOpen, setCreateOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferType, setTransferType] = useState<'credit' | 'debit'>('credit');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [blockTarget, setBlockTarget] = useState<Client | null>(null);
    const [blockLoading, setBlockLoading] = useState(false);

    const fetchData = useCallback(async (p = 1, search = '') => {
        setLoading(true);
        try {
            const res = await api.get<Client[]>('/api/clients/list', {
                page: String(p), limit: '20', search,
            });
            if (res.success && res.data) {
                setData(res.data);
                setTotal(res.pagination?.total || 0);
                setGrandTotal(res.grandTotal || {});
            }
        } catch { /* graceful */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleTransfer = (c: Client, type: 'credit' | 'debit') => {
        setSelectedClient(c); setTransferType(type); setTransferOpen(true);
    };

    const handleBlock = async () => {
        if (!blockTarget) return;
        setBlockLoading(true);
        try {
            await api.put(`/api/admin/users/${blockTarget.user_id}/block`, {
                is_blocked: !blockTarget.is_blocked,
            });
            fetchData(page);
        } catch { /* graceful */ } finally {
            setBlockLoading(false); setBlockTarget(null);
        }
    };

    const columns: Column<Client>[] = [
        { key: 'user_id', label: 'ID', render: (r) => <span className="font-mono text-xs font-semibold text-slate-600">{r.user_id}</span> },
        { key: 'name', label: 'Name', sortable: true, render: (r) => <span className="font-medium text-slate-700">{r.name}</span> },
        { key: 'parent_user_id', label: 'Parent', render: (r) => <span className="text-xs text-slate-500">{r.parent_user_id}</span> },
        { key: 'balance', label: 'Balance', align: 'right', sortable: true, isCurrency: true, grandTotalKey: 'balance' },
        { key: 'exposure', label: 'Exposure', align: 'right', isCurrency: true, grandTotalKey: 'exposure' },
        {
            key: 'status', label: 'Status', align: 'center',
            render: (r) => <Badge className={r.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>{r.is_blocked ? 'Blocked' : 'Active'}</Badge>,
        },
        {
            key: 'actions', label: 'Actions', align: 'center',
            render: (r) => (
                <div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleTransfer(r, 'credit')} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600" title="Credit"><ArrowUpCircle size={16} /></button>
                    <button onClick={() => handleTransfer(r, 'debit')} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Debit"><ArrowDownCircle size={16} /></button>
                    <button onClick={() => setBlockTarget(r)} className={`p-1.5 rounded-lg ${r.is_blocked ? 'hover:bg-green-50 text-green-600' : 'hover:bg-red-50 text-red-600'}`}>
                        {r.is_blocked ? <Shield size={16} /> : <ShieldOff size={16} />}
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><Eye size={16} /></button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
                <p className="text-sm text-slate-500 mt-1">Manage client accounts, coins, and access</p>
            </div>
            <DataTable title="All Clients" columns={columns} data={data} loading={loading}
                totalItems={total} page={page}
                onPageChange={(p) => { setPage(p); fetchData(p); }}
                onSearch={(s) => fetchData(1, s)} grandTotal={grandTotal} rowKey={(r) => r.id}
                actions={<Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-9" onClick={() => setCreateOpen(true)}><UserPlus size={14} className="mr-1" />Add Client</Button>}
            />
            <CreateAccountDialog open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => fetchData(page)} defaultRole="user" />
            {selectedClient && <CoinTransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} onSuccess={() => fetchData(page)} userId={selectedClient.user_id} userName={selectedClient.name} type={transferType} />}
            <ConfirmDialog open={!!blockTarget} onClose={() => setBlockTarget(null)} onConfirm={handleBlock}
                title={`${blockTarget?.is_blocked ? 'Unblock' : 'Block'} ${blockTarget?.name || ''}?`}
                message={blockTarget?.is_blocked ? 'This will restore access for this client.' : 'This will prevent this client from accessing the platform.'}
                confirmLabel={blockTarget?.is_blocked ? 'Unblock' : 'Block'}
                variant={blockTarget?.is_blocked ? 'info' : 'danger'} loading={blockLoading}
            />
        </div>
    );
}
