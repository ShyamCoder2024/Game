'use client';

// src/app/admin/clients/page.tsx
// B4/B5: Redesigned client table with deal%, credit limit, edit modal, and improved actions

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { CreateAccountDialog } from '@/components/leaders/CreateAccountDialog';
import { CoinTransferDialog } from '@/components/leaders/CoinTransferDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatIndianCurrency } from '@/lib/utils';
import {
    UserPlus, ArrowUpCircle, ArrowDownCircle,
    ShieldOff, Shield, Pencil, X, Save, Loader2,
} from 'lucide-react';

interface Client {
    id: number;
    user_id: string;
    name: string;
    role: string;
    wallet_balance: number;
    exposure: number;
    deal_percentage: number;
    credit_limit: number;
    fix_limit: number;
    my_matka_share: number;
    agent_matka_share: number;
    matka_commission: number;
    is_blocked: boolean;
    parent_user_id: string;
}

interface EditForm {
    name: string;
    deal_percentage: string;
    credit_limit: string;
    fix_limit: string;
    my_matka_share: string;
    agent_matka_share: string;
    matka_commission: string;
}

export default function ClientsPage() {
    const [data, setData] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [grandTotal, setGrandTotal] = useState<Record<string, number>>({});

    // Dialogs
    const [createOpen, setCreateOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferType, setTransferType] = useState<'credit' | 'debit'>('credit');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [blockTarget, setBlockTarget] = useState<Client | null>(null);
    const [blockLoading, setBlockLoading] = useState(false);

    // Edit modal (B11 pattern applied here too)
    const [editTarget, setEditTarget] = useState<Client | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({
        name: '', deal_percentage: '', credit_limit: '', fix_limit: '',
        my_matka_share: '', agent_matka_share: '', matka_commission: '',
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editMsg, setEditMsg] = useState('');
    const [editError, setEditError] = useState('');

    const fetchData = useCallback(async (p = 1, search = '') => {
        setLoading(true);
        try {
            const res = await api.get<Client[]>('/api/leaders/list', {
                page: String(p), limit: '20', role: 'user', search,
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
            const action = blockTarget.is_blocked ? 'unblock' : 'block';
            await api.put(`/api/admin/users/${blockTarget.user_id}/${action}`);
            fetchData(page);
        } catch { /* graceful */ } finally {
            setBlockLoading(false); setBlockTarget(null);
        }
    };

    const openEdit = (c: Client) => {
        setEditTarget(c);
        setEditForm({
            name: c.name,
            deal_percentage: String(c.deal_percentage ?? ''),
            credit_limit: String(c.credit_limit ?? ''),
            fix_limit: String(c.fix_limit ?? ''),
            my_matka_share: String(c.my_matka_share ?? ''),
            agent_matka_share: String(c.agent_matka_share ?? ''),
            matka_commission: String(c.matka_commission ?? ''),
        });
        setEditMsg(''); setEditError('');
    };

    const handleEditSave = async () => {
        if (!editTarget) return;
        setEditLoading(true); setEditMsg(''); setEditError('');
        try {
            const payload: Record<string, string | number> = {};
            if (editForm.name.trim()) payload.name = editForm.name.trim();
            if (editForm.deal_percentage !== '') payload.deal_percentage = Number(editForm.deal_percentage);
            if (editForm.credit_limit !== '') payload.credit_limit = Number(editForm.credit_limit);
            if (editForm.fix_limit !== '') payload.fix_limit = Number(editForm.fix_limit);
            if (editForm.my_matka_share !== '') payload.my_matka_share = Number(editForm.my_matka_share);
            if (editForm.agent_matka_share !== '') payload.agent_matka_share = Number(editForm.agent_matka_share);
            if (editForm.matka_commission !== '') payload.matka_commission = Number(editForm.matka_commission);

            const res = await api.put(`/api/leaders/${editTarget.id}`, payload);
            if (res.success) {
                setEditMsg('Saved successfully!');
                fetchData(page);
                setTimeout(() => { setEditTarget(null); setEditMsg(''); }, 1200);
            } else {
                setEditError(res.error?.message || 'Failed to save');
            }
        } catch { setEditError('Network error. Please try again.'); } finally { setEditLoading(false); }
    };

    const roleColors: Record<string, string> = {
        user: 'bg-blue-100 text-blue-700',
        master: 'bg-purple-100 text-purple-700',
        supermaster: 'bg-orange-100 text-orange-700',
        admin: 'bg-red-100 text-red-700',
    };

    const columns: Column<Client>[] = [
        {
            key: 'user_id', label: 'ID',
            render: (r) => <span className="font-mono text-xs font-semibold text-slate-600">{r.user_id}</span>
        },
        {
            key: 'name', label: 'Name', sortable: true,
            render: (r) => (
                <div>
                    <p className="font-medium text-slate-700">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.parent_user_id}</p>
                </div>
            )
        },
        {
            key: 'role', label: 'Role', align: 'center',
            render: (r) => <Badge className={roleColors[r.role] || 'bg-slate-100 text-slate-600'}>{r.role}</Badge>,
        },
        {
            key: 'wallet_balance', label: 'Balance', align: 'right', sortable: true, isCurrency: true, grandTotalKey: 'balance'
        },
        {
            key: 'exposure', label: 'Exposure', align: 'right', isCurrency: true, grandTotalKey: 'exposure'
        },
        {
            key: 'deal_percentage', label: 'Deal %', align: 'center', sortable: true,
            render: (r) => <span className="font-semibold text-slate-700">{r.deal_percentage ?? '—'}%</span>
        },
        {
            key: 'credit_limit', label: 'Credit Limit', align: 'right',
            render: (r) => <span className="text-sm text-slate-600">{r.credit_limit != null ? formatIndianCurrency(r.credit_limit) : '—'}</span>
        },
        {
            key: 'is_blocked', label: 'Status', align: 'center',
            render: (r) => (
                <Badge className={r.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {r.is_blocked ? 'Blocked' : 'Active'}
                </Badge>
            ),
        },
        {
            key: 'id', label: 'Actions', align: 'center',
            render: (r) => (
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => handleTransfer(r, 'credit')}
                        className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                        title="Credit Coins"
                    >
                        <ArrowUpCircle size={16} />
                    </button>
                    <button
                        onClick={() => handleTransfer(r, 'debit')}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        title="Debit Coins"
                    >
                        <ArrowDownCircle size={16} />
                    </button>
                    <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        title="Edit Member"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => setBlockTarget(r)}
                        className={`p-1.5 rounded-lg transition-colors ${r.is_blocked ? 'hover:bg-green-50 text-green-600' : 'hover:bg-red-50 text-red-600'}`}
                        title={r.is_blocked ? 'Unblock' : 'Block'}
                    >
                        {r.is_blocked ? <Shield size={16} /> : <ShieldOff size={16} />}
                    </button>
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

            <DataTable
                title="All Clients"
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
                        <UserPlus size={14} className="mr-1" />Add Client
                    </Button>
                }
            />

            {/* Edit Member Modal */}
            {editTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-0 shadow-2xl">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold text-slate-700">
                                Edit — {editTarget.name} <span className="text-xs font-mono text-slate-400 ml-1">({editTarget.user_id})</span>
                            </CardTitle>
                            <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Name</Label>
                                    <Input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="bg-slate-50" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Deal % (0–100)</Label>
                                    <Input type="number" min="0" max="100" value={editForm.deal_percentage} onChange={(e) => setEditForm(f => ({ ...f, deal_percentage: e.target.value }))} className="bg-slate-50" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Credit Limit (₹)</Label>
                                    <Input type="number" min="0" value={editForm.credit_limit} onChange={(e) => setEditForm(f => ({ ...f, credit_limit: e.target.value }))} className="bg-slate-50" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Fix Limit (₹)</Label>
                                    <Input type="number" min="0" value={editForm.fix_limit} onChange={(e) => setEditForm(f => ({ ...f, fix_limit: e.target.value }))} className="bg-slate-50" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">My Matka Share %</Label>
                                    <Input type="number" min="0" max="100" value={editForm.my_matka_share} onChange={(e) => setEditForm(f => ({ ...f, my_matka_share: e.target.value }))} className="bg-slate-50" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Agent Matka Share %</Label>
                                    <Input type="number" min="0" max="100" value={editForm.agent_matka_share} onChange={(e) => setEditForm(f => ({ ...f, agent_matka_share: e.target.value }))} className="bg-slate-50" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Matka Commission %</Label>
                                    <Input type="number" min="0" max="100" value={editForm.matka_commission} onChange={(e) => setEditForm(f => ({ ...f, matka_commission: e.target.value }))} className="bg-slate-50" />
                                </div>
                            </div>
                            {editError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{editError}</p>}
                            {editMsg && <p className="text-sm text-green-600 bg-green-50 rounded-lg p-2">{editMsg}</p>}
                            <div className="flex gap-3 pt-1">
                                <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEditSave} disabled={editLoading}>
                                    {editLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <CreateAccountDialog open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => fetchData(page)} defaultRole="user" />
            {selectedClient && (
                <CoinTransferDialog
                    open={transferOpen}
                    onClose={() => setTransferOpen(false)}
                    onSuccess={() => fetchData(page)}
                    userId={selectedClient.id}
                    userName={selectedClient.name}
                    type={transferType}
                />
            )}
            <ConfirmDialog
                open={!!blockTarget}
                onClose={() => setBlockTarget(null)}
                onConfirm={handleBlock}
                title={`${blockTarget?.is_blocked ? 'Unblock' : 'Block'} ${blockTarget?.name || ''}?`}
                message={blockTarget?.is_blocked ? 'This will restore access for this client.' : 'This will prevent this client from accessing the platform.'}
                confirmLabel={blockTarget?.is_blocked ? 'Unblock' : 'Block'}
                variant={blockTarget?.is_blocked ? 'info' : 'danger'}
                loading={blockLoading}
            />
        </div>
    );
}
