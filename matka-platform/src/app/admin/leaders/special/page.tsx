'use client';

// src/app/admin/leaders/special/page.tsx
// Special masters page

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Eye, Star } from 'lucide-react';

interface SpecialMember {
    id: number; user_id: string; name: string; role: string;
    balance: number; exposure: number; deal_percentage: number;
    is_blocked: boolean;
}

export default function SpecialMastersPage() {
    const [data, setData] = useState<SpecialMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [grandTotal, setGrandTotal] = useState<Record<string, number>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<SpecialMember[]>('/api/leaders/special');
            if (res.success && res.data) {
                setData(res.data);
                setTotal(res.data.length);
                setGrandTotal(res.grandTotal || {});
            }
        } catch { /* graceful */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const columns: Column<SpecialMember>[] = [
        { key: 'user_id', label: 'ID', render: (r) => <span className="font-mono text-xs font-semibold text-purple-600">{r.user_id}</span> },
        {
            key: 'name', label: 'Name', sortable: true, render: (r) => (
                <span className="font-medium text-slate-700 flex items-center gap-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" /> {r.name}
                </span>
            )
        },
        { key: 'role', label: 'Role', render: (r) => <Badge variant="secondary" className="text-xs capitalize">{r.role}</Badge> },
        { key: 'balance', label: 'Balance', align: 'right', sortable: true, isCurrency: true, grandTotalKey: 'balance' },
        { key: 'exposure', label: 'Exposure', align: 'right', isCurrency: true, grandTotalKey: 'exposure' },
        { key: 'deal_percentage', label: 'Deal %', align: 'center', render: (r) => <span className="font-semibold">{r.deal_percentage}%</span> },
        {
            key: 'status', label: 'Status', align: 'center',
            render: (r) => <Badge className={r.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>{r.is_blocked ? 'Blocked' : 'Active'}</Badge>,
        },
        {
            key: 'actions', label: '', align: 'center',
            render: () => <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><Eye size={16} /></button>,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Special Masters</h1>
                <p className="text-sm text-slate-500 mt-1">Members with special deal configurations</p>
            </div>
            <DataTable title="Special Masters" columns={columns} data={data} loading={loading}
                totalItems={total} grandTotal={grandTotal} rowKey={(r) => r.id}
            />
        </div>
    );
}
