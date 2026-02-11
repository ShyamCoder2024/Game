'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UserChangePasswordPage() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return;
        setLoading(true);
        try {
            await api.post('/api/auth/change-password', { oldPassword, newPassword });
            setSuccess(true);
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
            setTimeout(() => setSuccess(false), 3000);
        } catch { /* handled */ }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Link href="/user/profile" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} /></Link>
                <div className="flex items-center gap-2">
                    <Lock size={18} className="text-[#059669]" />
                    <h2 className="text-lg font-bold text-gray-800">Change Password</h2>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Current Password</label>
                        <div className="relative mt-1">
                            <input
                                type={showOld ? 'text' : 'password'}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Enter current password"
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
                            />
                            <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">New Password</label>
                        <div className="relative mt-1">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={loading || newPassword !== confirmPassword}
                        className="w-full py-3 rounded-xl bg-[#059669] text-white font-bold hover:bg-[#047857] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                    {success && (
                        <p className="text-sm text-green-600 flex items-center justify-center gap-1">
                            <CheckCircle2 size={14} /> Password changed successfully!
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
