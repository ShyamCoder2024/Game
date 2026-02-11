'use client';

// src/app/admin/settings/page.tsx
// Settings — password change, user blocking, DB backup

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import {
    Lock, Shield, Database, Download, CheckCircle2,
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
            </div>
        </div>
    );
}
