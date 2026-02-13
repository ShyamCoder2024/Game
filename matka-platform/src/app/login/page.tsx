'use client';

// src/app/login/page.tsx
// Login page — Admin login with ID + password

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((s) => s.login);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post<{
                user: { id: number; user_id: string; name: string; role: 'admin' | 'supermaster' | 'master' | 'user' };
                accessToken: string;
            }>('/api/auth/login', { user_id: userId, password });

            if (!res.success || !res.data) {
                setError(res.error?.message || 'Invalid credentials');
                return;
            }

            login(res.data.user, res.data.accessToken);

            // Redirect based on role
            const roleRoutes: Record<string, string> = {
                admin: '/admin',
                supermaster: '/supermaster',
                master: '/master',
                user: '/user',
            };
            router.push(roleRoutes[res.data.user.role] || '/login');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 overflow-hidden relative">

            {/* Background Gradients - Deep Dark Blue */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#020617] to-[#0F172A]" />
            <div className="absolute top-0 left-0 w-full h-[600px] bg-blue-900/10 blur-[150px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-[340px] sm:max-w-[380px] relative z-10"
            >
                {/* Main Card - Solid White for High Contrast */}
                <Card className="border-0 shadow-2xl bg-white ring-1 ring-white/5 rounded-2xl overflow-hidden">

                    <CardHeader className="space-y-4 text-center pb-0 pt-8 px-6">
                        {/* Logo Container - Restored Image */}
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="mx-auto"
                        >
                            <div className="relative w-24 h-24 mx-auto">
                                <Image
                                    src="/logo.png"
                                    alt="All India Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </motion.div>

                        <div className="space-y-1">
                            <motion.h1
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl font-bold text-slate-900 tracking-tight"
                            >
                                Welcome Back
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-slate-500 text-sm font-medium"
                            >
                                Please sign in to continue
                            </motion.p>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 px-6 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <motion.div
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-1.5"
                            >
                                <Label htmlFor="userId" className="text-slate-700 text-xs font-bold ml-1 uppercase tracking-wide">
                                    User ID
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <Input
                                        id="userId"
                                        placeholder="Enter your ID"
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                        className="h-11 pl-10 bg-slate-50 border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-lg"
                                        required
                                    />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-1.5"
                            >
                                <Label htmlFor="password" className="text-slate-700 text-xs font-bold ml-1 uppercase tracking-wide">
                                    Password
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-11 pl-10 bg-slate-50 border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-lg"
                                        required
                                    />
                                </div>
                            </motion.div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-100 flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all duration-200 rounded-lg mt-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <span className="flex items-center gap-2 justify-center">
                                            Sign In
                                            <ArrowRight size={16} />
                                        </span>
                                    )}
                                </Button>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
