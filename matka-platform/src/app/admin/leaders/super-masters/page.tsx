'use client';

// src/app/admin/leaders/super-masters/page.tsx
// Super Masters management page

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { CreateAccountDialog } from '@/components/leaders/CreateAccountDialog';
import { CoinTransferDialog } from '@/components/leaders/CoinTransferDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { UserPlus, ArrowUpCircle, ArrowDownCircle, Lock, Eye } from 'lucide-react';

interface Member {
    id: number;
    user_id: string;
    name: string;
    role: string;
    balance: number;
    exposure: number;
    deal_percentage: number;
    status: string;
    is_blocked: boolean;
    created_at: string;
}

export default function SuperMastersPage() {
    const [data, setData] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [grandTotal, setGrandTotal] = useState<Record<string, number>>({});
    const [createOpen, setCreateOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferType, setTransferType] = useState<'credit' | 'debit'>('credit');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    const fetchData = useCallback(async (p = 1, search = '') => {
        setLoading(true);
        try {
            const res = await api.get<Member[]>('/api/leaders/list', {
                page: String(p),
                limit: '20',
                role: 'supermaster',
                search,
            });
            if (res.success && res.data) {
                setData(res.data);
                setTotal(res.pagination?.total || 0);
                setGrandTotal(res.grandTotal || {});
            }
        } catch { /* graceful */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleTransfer = (member: Member, type: 'credit' | 'debit') => {
        setSelectedMember(member);
        setTransferType(type);
        setTransferOpen(true);
    };

    const columns: Column<Member>[] = [
        { key: 'user_id', label: 'ID', render: (r) => <span className="font-mono text-xs font-semibold text-blue-600">{r.user_id}</span> },
        { key: 'name', label: 'Name', sortable: true, render: (r) => <span className="font-medium text-slate-700">{r.name}</span> },
        {
            key: 'role', label: 'Role', align: 'center',
            render: (r) => {
                const roleColors: Record<string, string> = {
                    user: 'bg-blue-100 text-blue-700',
                    master: 'bg-purple-100 text-purple-700',
                    supermaster: 'bg-orange-100 text-orange-700',
                };
                return <Badge className={roleColors[r.role] || 'bg-slate-100 text-slate-600'}>{r.role}</Badge>;
            },
        },
        { key: 'balance', label: 'Balance', align: 'right', sortable: true, isCurrency: true, grandTotalKey: 'balance' },
        { key: 'exposure', label: 'Exposure', align: 'right', isCurrency: true, grandTotalKey: 'exposure' },
        { key: 'deal_percentage', label: 'Deal %', align: 'center', sortable: true, render: (r) => <span className="font-semibold">{r.deal_percentage}%</span> },
        {
            key: 'status', label: 'Status', align: 'center',
            render: (r) => (
                <Badge className={r.is_blocked ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}>
                    {r.is_blocked ? 'Blocked' : 'Active'}
                </Badge>
            ),
        },
        {
            key: 'actions', label: 'Actions', align: 'center',
            render: (r) => (
                <div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleTransfer(r, 'credit')} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors" title="Credit">
                        <ArrowUpCircle size={16} />
                    </button>
                    <button onClick={() => handleTransfer(r, 'debit')} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="Debit">
                        <ArrowDownCircle size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="View">
                        <Eye size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors" title="Change Password">
                        <Lock size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Super Masters</h1>
                <p className="text-sm text-slate-500 mt-1">Manage super master accounts</p>
            </div>

            <DataTable<Member>
                title="Super Masters"
                columns={columns}
                data={data}
                loading={loading}
                totalItems={total}
                page={page}
                onPageChange={(p) => { setPage(p); fetchData(p); }}
                onSearch={(s) => fetchData(1, s)}
                grandTotal={grandTotal}
                rowKey={(r) => r.id}
                actions={
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-9" onClick={() => setCreateOpen(true)}>
                        <UserPlus size={14} className="mr-1" />
                        Add SM
                    </Button>
                }
            />

            <CreateAccountDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSuccess={() => fetchData(page)}
                defaultRole="supermaster"
            />

            {selectedMember && (
                <CoinTransferDialog
                    open={transferOpen}
                    onClose={() => setTransferOpen(false)}
                    onSuccess={() => fetchData(page)}
                    userId={selectedMember.id}
                    userName={selectedMember.name}
                    type={transferType}
                />
            )}
        </div>
    );
}
