'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { CoinTransferDialog } from '@/components/leaders/CoinTransferDialog';
import { api } from '@/lib/api';
import { Wallet, Ban, CheckCircle2 } from 'lucide-react';

interface ClientRow {
    id: number;
    user_id: string;
    name: string;
    balance: number;
    credit_ref: number;
    pnl: number;
    status: string;
}

export default function MasterClientsPage() {
    const [data, setData] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [coinTarget, setCoinTarget] = useState<{ id: string; name: string; mode: 'credit' | 'debit' } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<ClientRow[]>('/api/clients');
            if (res.success && res.data) setData(res.data);
        } catch {
            setData([
                { id: 1, user_id: 'USR201', name: 'Player Alpha', balance: 35000, credit_ref: 100000, pnl: 7200, status: 'active' },
                { id: 2, user_id: 'USR202', name: 'Player Beta', balance: 12000, credit_ref: 50000, pnl: -1500, status: 'active' },
            ]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const columns = [
        { key: 'user_id', label: 'User ID', render: (row: ClientRow) => <span className="font-semibold text-[#0891B2]">{row.user_id}</span> },
        { key: 'name', label: 'Name' },
        { key: 'balance', label: 'Balance', isCurrency: true },
        { key: 'credit_ref', label: 'Credit Ref', isCurrency: true },
        {
            key: 'pnl', label: 'P/L', render: (row: ClientRow) => (
                <span className={row.pnl >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {row.pnl >= 0 ? '↑' : '↓'} ₹{Math.abs(row.pnl).toLocaleString('en-IN')}
                </span>
            )
        },
        {
            key: 'status', label: 'Status', render: (row: ClientRow) => (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${row.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {row.status === 'active' ? 'Active' : 'Blocked'}
                </span>
            )
        },
        {
            key: 'actions', label: 'Actions', render: (row: ClientRow) => (
                <div className="flex items-center gap-1">
                    <button onClick={() => setCoinTarget({ id: row.user_id, name: row.name, mode: 'credit' })} className="w-7 h-7 rounded bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors" title="Credit">D</button>
                    <button onClick={() => setCoinTarget({ id: row.user_id, name: row.name, mode: 'debit' })} className="w-7 h-7 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors" title="Withdraw">W</button>
                    {row.status === 'active'
                        ? <button className="w-7 h-7 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors" title="Block"><Ban size={14} className="mx-auto" /></button>
                        : <button className="w-7 h-7 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors" title="Unblock"><CheckCircle2 size={14} className="mx-auto" /></button>
                    }
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                    <Wallet className="text-[#0891B2]" size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Clients</h1>
                    <p className="text-sm text-gray-500">Your user accounts</p>
                </div>
            </div>
            <DataTable columns={columns} data={data} loading={loading} searchKey="name" searchPlaceholder="Search clients..." grandTotal={{ balance: true, credit_ref: true, pnl: true }} />
            {coinTarget && <CoinTransferDialog open={!!coinTarget} onClose={() => setCoinTarget(null)} onSuccess={fetchData} userId={coinTarget.id} userName={coinTarget.name} mode={coinTarget.mode} />}
        </div>
    );
}
