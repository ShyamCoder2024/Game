'use client';

// src/app/admin/settings/page.tsx
// Settings — password change, user blocking, DB backup

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import {
    Lock, Shield, Database, Download, CheckCircle2, Percent, TrendingDown, TrendingUp, Zap,
} from 'lucide-react';

export default function SettingsPage() {
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdMsg, setPwdMsg] = useState('');
    const [pwdError, setPwdError] = useState('');

    const [blockUserId, setBlockUserId] = useState('');
    const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block');
    const [blockLoading, setBlockLoading] = useState(false);
    const [blockMsg, setBlockMsg] = useState('');

    const [backupLoading, setBackupLoading] = useState(false);
    const [backupMsg, setBackupMsg] = useState('');

    // Change Member Password (A6 fix)
    const [memberUserId, setMemberUserId] = useState('');
    const [memberNewPwd, setMemberNewPwd] = useState('');
    const [memberPwdLoading, setMemberPwdLoading] = useState(false);
    const [memberPwdMsg, setMemberPwdMsg] = useState('');
    const [memberPwdError, setMemberPwdError] = useState('');

    // Default Rates (B10)
    const [dealPct, setDealPct] = useState('85');
    const [minBet, setMinBet] = useState('10');
    const [maxBet, setMaxBet] = useState('100000');
    const [ratesLoading, setRatesLoading] = useState(false);
    const [ratesMsg, setRatesMsg] = useState('');

    // Payout Multipliers
    const BET_TYPES = [
        { key: 'SINGLE_AKDA', label: 'Single Akda', color: 'blue' },
        { key: 'SINGLE_PATTI', label: 'Single Patti', color: 'emerald' },
        { key: 'DOUBLE_PATTI', label: 'Double Patti', color: 'amber' },
        { key: 'TRIPLE_PATTI', label: 'Triple Patti', color: 'purple' },
        { key: 'JODI', label: 'Jodi', color: 'rose' },
    ] as const;
    const [multipliers, setMultipliers] = useState<Record<string, string>>({
        SINGLE_AKDA: '10',
        SINGLE_PATTI: '160',
        DOUBLE_PATTI: '320',
        TRIPLE_PATTI: '700',
        JODI: '100',
    });
    const [multipliersLoading, setMultipliersLoading] = useState(false);
    const [multipliersMsg, setMultipliersMsg] = useState('');

    useEffect(() => {
        const fetchRates = async () => {
            const [dealRes, minRes, maxRes] = await Promise.allSettled([
                api.get<{ value: string }>('/api/admin/settings/default_deal_percentage'),
                api.get<{ value: string }>('/api/admin/settings/min_bet_amount'),
                api.get<{ value: string }>('/api/admin/settings/max_bet_amount'),
            ]);
            if (dealRes.status === 'fulfilled' && dealRes.value.data) setDealPct(dealRes.value.data.value);
            if (minRes.status === 'fulfilled' && minRes.value.data) setMinBet(minRes.value.data.value);
            if (maxRes.status === 'fulfilled' && maxRes.value.data) setMaxBet(maxRes.value.data.value);

            // Fetch global payout multipliers
            try {
                const mRes = await api.get<{ bet_type: string; multiplier: number }[]>('/api/admin/games/global-multipliers');
                if (mRes.data && mRes.data.length > 0) {
                    const map: Record<string, string> = {};
                    for (const m of mRes.data) {
                        map[m.bet_type] = String(m.multiplier);
                    }
                    setMultipliers((prev) => ({ ...prev, ...map }));
                }
            } catch { /* use defaults */ }
        };
        fetchRates();
    }, []);

    const handleSaveRates = async () => {
        setRatesLoading(true); setRatesMsg('');
        try {
            await Promise.all([
                api.put('/api/admin/settings/default_deal_percentage', { value: dealPct }),
                api.put('/api/admin/settings/min_bet_amount', { value: minBet }),
                api.put('/api/admin/settings/max_bet_amount', { value: maxBet }),
            ]);
            setRatesMsg('Default rates saved!');
            setTimeout(() => setRatesMsg(''), 3000);
        } catch { /* graceful */ } finally { setRatesLoading(false); }
    };

    const handleSaveMultipliers = async () => {
        setMultipliersLoading(true); setMultipliersMsg('');
        try {
            const payload = {
                multipliers: Object.entries(multipliers).map(([bet_type, multiplier]) => ({
                    bet_type,
                    multiplier: parseInt(multiplier, 10),
                })),
            };
            await api.put('/api/admin/games/multipliers', payload);
            setMultipliersMsg('Payout multipliers saved!');
            setTimeout(() => setMultipliersMsg(''), 3000);
        } catch { /* graceful */ } finally { setMultipliersLoading(false); }
    };

    const handleMemberPasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMemberPwdMsg(''); setMemberPwdError('');
        if (!memberUserId.trim() || memberNewPwd.length < 6) {
            setMemberPwdError('Enter a valid User ID and password (min 6 chars)');
            return;
        }
        setMemberPwdLoading(true);
        try {
            // Step 1: Look up member by user_id string to get numeric id
            const searchRes = await api.get<{ id: number; user_id: string }[]>('/api/leaders/list', { search: memberUserId.trim(), limit: '5' });
            const member = searchRes.data?.find((m) => m.user_id === memberUserId.trim());
            if (!member) {
                setMemberPwdError(`No member found with User ID: ${memberUserId}`);
                return;
            }
            // Step 2: Change password using numeric id
            const res = await api.put(`/api/leaders/${member.id}/password`, { new_password: memberNewPwd });
            if (res.success) {
                setMemberPwdMsg(`Password changed for ${memberUserId}`);
                setMemberUserId(''); setMemberNewPwd('');
            } else {
                setMemberPwdError(res.error?.message || 'Failed to change password');
            }
        } catch {
            setMemberPwdError('Network error. Please try again.');
        } finally { setMemberPwdLoading(false); }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwdMsg(''); setPwdError('');

        if (newPwd !== confirmPwd) {
            setPwdError('Passwords do not match');
            return;
        }
        if (newPwd.length < 6) {
            setPwdError('Password must be at least 6 characters');
            return;
        }

        setPwdLoading(true);
        try {
            const res = await api.post('/api/auth/change-password', {
                current_password: currentPwd,
                new_password: newPwd,
            });
            if (res.success) {
                setPwdMsg('Password changed successfully');
                setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
            } else {
                setPwdError(res.error?.message || 'Failed to change password');
            }
        } catch {
            setPwdError('Network error. Please try again.');
        } finally { setPwdLoading(false); }
    };

    const handleBlockUser = async () => {
        if (!blockUserId.trim()) return;
        setBlockLoading(true); setBlockMsg('');
        try {
            await api.put(`/api/admin/users/${blockUserId}/${blockAction}`);
            setBlockMsg(`User ${blockUserId} ${blockAction}ed successfully`);
            setBlockUserId('');
        } catch {
            setBlockMsg('Failed. Check user ID and try again.');
        } finally { setBlockLoading(false); }
    };

    const handleBackup = async () => {
        setBackupLoading(true); setBackupMsg('');
        try {
            const res = await api.post<{ url: string }>('/api/admin/backup');
            if (res.success) {
                setBackupMsg('Backup created successfully');
            } else {
                setBackupMsg('Backup failed. Try again.');
            }
        } catch {
            setBackupMsg('Network error.');
        } finally { setBackupLoading(false); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                <p className="text-sm text-slate-500 mt-1">Account settings and platform management</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Password change */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <Lock size={16} className="text-blue-500" />
                            Change Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">Current Password</Label>
                                <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required className="bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">New Password</Label>
                                <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required className="bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">Confirm New Password</Label>
                                <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required className="bg-slate-50" />
                            </div>
                            {pwdError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{pwdError}</p>}
                            {pwdMsg && <p className="text-sm text-green-600 bg-green-50 rounded-lg p-2 flex items-center gap-1"><CheckCircle2 size={14} />{pwdMsg}</p>}
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={pwdLoading}>
                                {pwdLoading ? 'Changing...' : 'Change Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Block / Unblock user */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <Shield size={16} className="text-amber-500" />
                            Block / Unblock User
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">User ID</Label>
                                <Input value={blockUserId} onChange={(e) => setBlockUserId(e.target.value)} placeholder="Enter user ID" className="bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">Action</Label>
                                <select value={blockAction} onChange={(e) => setBlockAction(e.target.value as 'block' | 'unblock')}
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                                >
                                    <option value="block">Block</option>
                                    <option value="unblock">Unblock</option>
                                </select>
                            </div>
                            {blockMsg && <p className="text-sm text-blue-600 bg-blue-50 rounded-lg p-2">{blockMsg}</p>}
                            <Button onClick={handleBlockUser} className={`${blockAction === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`} disabled={blockLoading}>
                                {blockLoading ? 'Processing...' : blockAction === 'block' ? 'Block User' : 'Unblock User'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* DB Backup */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <Database size={16} className="text-purple-500" />
                            Database Backup
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-4">
                            Create a full database backup. This may take a few minutes depending on data size.
                        </p>
                        {backupMsg && <p className="text-sm text-green-600 bg-green-50 rounded-lg p-2 mb-4 flex items-center gap-1"><CheckCircle2 size={14} />{backupMsg}</p>}
                        <Button onClick={handleBackup} className="bg-purple-600 hover:bg-purple-700 text-white" disabled={backupLoading}>
                            <Download size={14} className="mr-1" />
                            {backupLoading ? 'Creating Backup...' : 'Create Backup'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Change Member Password (A6) */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <Lock size={16} className="text-orange-500" />
                            Change Member Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleMemberPasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">Member User ID</Label>
                                <Input
                                    value={memberUserId}
                                    onChange={(e) => setMemberUserId(e.target.value)}
                                    placeholder="e.g. SM001, MA002, US003"
                                    className="bg-slate-50"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">New Password</Label>
                                <Input
                                    type="password"
                                    value={memberNewPwd}
                                    onChange={(e) => setMemberNewPwd(e.target.value)}
                                    placeholder="Min 6 characters"
                                    className="bg-slate-50"
                                    required
                                    minLength={6}
                                />
                            </div>
                            {memberPwdError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{memberPwdError}</p>}
                            {memberPwdMsg && <p className="text-sm text-green-600 bg-green-50 rounded-lg p-2 flex items-center gap-1"><CheckCircle2 size={14} />{memberPwdMsg}</p>}
                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={memberPwdLoading}>
                                {memberPwdLoading ? 'Changing...' : 'Change Member Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

            </div>

            {/* Payout Multipliers — full width */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" />
                        Global Payout Multipliers
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Default payout rates for all games. Per-game overrides can be set from the Games page.
                    </p>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {BET_TYPES.map((bt) => (
                            <div key={bt.key} className={`bg-${bt.color}-50 border border-${bt.color}-100 rounded-xl p-4 space-y-3`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-semibold text-${bt.color}-700 uppercase tracking-wide leading-tight`}>
                                        {bt.label}
                                    </span>
                                    <span className={`text-xs font-bold text-${bt.color}-500`}>×</span>
                                </div>
                                <Input
                                    type="number"
                                    min="1"
                                    value={multipliers[bt.key] ?? ''}
                                    onChange={(e) => setMultipliers((prev) => ({ ...prev, [bt.key]: e.target.value }))}
                                    className={`bg-white border-${bt.color}-200 text-${bt.color}-800 font-bold text-xl h-12 text-center`}
                                />
                                <p className={`text-xs text-${bt.color}-500`}>
                                    Pays {multipliers[bt.key] || '?'}× bet
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-600 flex-wrap">
                        {BET_TYPES.map((bt) => (
                            <span key={bt.key}>
                                {bt.label}: <strong className="text-slate-800">{multipliers[bt.key]}×</strong>
                            </span>
                        ))}
                    </div>

                    {multipliersMsg && (
                        <p className="text-sm text-green-600 bg-green-50 rounded-lg p-2 flex items-center gap-1">
                            <CheckCircle2 size={14} />{multipliersMsg}
                        </p>
                    )}
                    <Button
                        onClick={handleSaveMultipliers}
                        disabled={multipliersLoading}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-6"
                    >
                        <Zap size={14} className="mr-1" />
                        {multipliersLoading ? 'Saving...' : 'Save Payout Rates'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
