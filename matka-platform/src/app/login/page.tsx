'use client';

// src/app/login/page.tsx
// Login page — Admin login with ID + password

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0djJoLTR2LTJoNHptMC0xMnYyaC00VjJoNHptMTIgMTJ2MmgtNHYtMmg0em0wLTEydjJoLTRWMmg0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

            <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="space-y-3 text-center pb-2">
                    {/* Logo */}
                    {/* Logo */}
                    <div className="mx-auto mb-4">
                        <div className="relative w-32 h-32 mx-auto">
                            <Image
                                src="/logo.png"
                                alt="All India Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-slate-800">
                        All India
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        Enter your credentials to access the panel
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="userId" className="text-slate-700 font-medium">
                                User ID
                            </Label>
                            <Input
                                id="userId"
                                placeholder="Enter your ID (e.g., ADMIN)"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700 font-medium">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-100">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all duration-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
