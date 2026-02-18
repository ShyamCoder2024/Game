'use client';

// src/app/admin/leaders/special/page.tsx
// Special masters page with role filtering (A12 fix)

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Eye, Star } from 'lucide-react';

interface SpecialMember {
    id: number; user_id: string; name: string; role: string;
    wallet_balance: number; exposure: number; deal_percentage: number;
    is_blocked: boolean;
}

export default function SpecialMastersPage() {
    const [data, setData] = useState<SpecialMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [grandTotal, setGrandTotal] = useState<Record<string, number>>({});
    const [roleFilter, setRoleFilter] = useState<'all' | 'supermaster' | 'master'>('all');

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

    // Client-side role filtering
    const filteredData = roleFilter === 'all' ? data : data.filter((m) => m.role === roleFilter);

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
        { key: 'wallet_balance', label: 'Balance', align: 'right', sortable: true, isCurrency: true, grandTotalKey: 'balance' },
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Special Masters</h1>
                    <p className="text-sm text-slate-500 mt-1">Members with special deal configurations</p>
                </div>
                {/* Role filter dropdown (A12) */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-500">Filter by role:</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as 'all' | 'supermaster' | 'master')}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="supermaster">Super Master</option>
                        <option value="master">Master</option>
                    </select>
                </div>
            </div>
            <DataTable title={`Special Masters${roleFilter !== 'all' ? ` — ${roleFilter}` : ''}`} columns={columns} data={filteredData} loading={loading}
                totalItems={filteredData.length} grandTotal={grandTotal} rowKey={(r) => r.id}
            />
        </div>
    );
}
