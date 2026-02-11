'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, CheckCircle2, Search } from 'lucide-react';

export default function SMChangePasswordPage() {
    // Self password change
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [selfLoading, setSelfLoading] = useState(false);
    const [selfSuccess, setSelfSuccess] = useState(false);

    // Downline password change
    const [searchId, setSearchId] = useState('');
    const [downlinePassword, setDownlinePassword] = useState('');
    const [downlineLoading, setDownlineLoading] = useState(false);
    const [downlineSuccess, setDownlineSuccess] = useState(false);

    const handleSelfChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return;
        setSelfLoading(true);
        try {
            await api.post('/api/auth/change-password', { oldPassword, newPassword });
            setSelfSuccess(true);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSelfSuccess(false), 3000);
        } catch { /* handled */ }
        setSelfLoading(false);
    };

    const handleDownlineChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId || !downlinePassword) return;
        setDownlineLoading(true);
        try {
            await api.post('/api/auth/change-password-admin', { userId: searchId, newPassword: downlinePassword });
            setDownlineSuccess(true);
            setSearchId('');
            setDownlinePassword('');
            setTimeout(() => setDownlineSuccess(false), 3000);
        } catch { /* handled */ }
        setDownlineLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Lock className="text-[#7C3AED]" size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Change Password</h1>
                    <p className="text-sm text-gray-500">Change your own password or downline&apos;s password</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Self Password Change */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Lock size={18} className="text-[#7C3AED]" />
                            Change Your Password
                        </h3>
                        <form onSubmit={handleSelfChange} className="space-y-4">
                            <div>
                                <Label>Current Password</Label>
                                <div className="relative mt-1">
                                    <Input
                                        type={showOld ? 'text' : 'password'}
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <Label>New Password</Label>
                                <div className="relative mt-1">
                                    <Input
                                        type={showNew ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    className="mt-1"
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                )}
                            </div>
                            <Button type="submit" disabled={selfLoading || newPassword !== confirmPassword} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9]">
                                {selfLoading ? 'Changing...' : 'Change Password'}
                            </Button>
                            {selfSuccess && (
                                <p className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Password changed successfully
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Downline Password Change */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Search size={18} className="text-[#7C3AED]" />
                            Change Downline Password
                        </h3>
                        <form onSubmit={handleDownlineChange} className="space-y-4">
                            <div>
                                <Label>Member ID</Label>
                                <Input
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    placeholder="Enter member ID (e.g. MST001)"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={downlinePassword}
                                    onChange={(e) => setDownlinePassword(e.target.value)}
                                    placeholder="Enter new password for member"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <Button type="submit" disabled={downlineLoading} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9]">
                                {downlineLoading ? 'Updating...' : 'Update Password'}
                            </Button>
                            {downlineSuccess && (
                                <p className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Downline password updated
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
