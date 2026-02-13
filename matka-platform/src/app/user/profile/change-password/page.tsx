'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserChangePasswordPage() {
    const router = useRouter();
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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Premium Header */}
            <div className="sticky top-0 z-30 bg-[#003366] text-white shadow-lg">
                <div className="flex items-center gap-4 px-4 py-4 max-w-lg mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold tracking-wide">Change Password</h1>
                        <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">
                            Security Settings
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Intro Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                        <ShieldCheck size={24} className="text-[#003366]" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">Secure Your Account</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Choose a strong password to protect your winnings and personal data.
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-100/50 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#003366]/5 rounded-full -mr-8 -mt-8 pointer-events-none" />

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        {/* Current Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                                <KeyRound size={14} className="text-[#003366]" /> Current Password
                            </label>
                            <div className="relative group">
                                <input
                                    type={showOld ? 'text' : 'password'}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    required
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#003366] focus:outline-none focus:ring-4 focus:ring-[#003366]/5 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOld(!showOld)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors p-1"
                                >
                                    {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                                <Lock size={14} className="text-[#003366]" /> New Password
                            </label>
                            <div className="relative group">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#003366] focus:outline-none focus:ring-4 focus:ring-[#003366]/5 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors p-1"
                                >
                                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-[#003366]" /> Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-4 transition-all ${confirmPassword && newPassword !== confirmPassword
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                                            : 'border-gray-200 focus:border-[#003366] focus:ring-[#003366]/5'
                                        }`}
                                />
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || newPassword !== confirmPassword || !oldPassword || !newPassword}
                                className="w-full py-4 rounded-xl bg-[#003366] text-white font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] hover:shadow-xl hover:shadow-[#003366]/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        Update Password
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200 z-20">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 size={32} className="text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">Password Updated!</h3>
                                <p className="text-xs text-gray-500 mt-1">Your account is now secure.</p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
