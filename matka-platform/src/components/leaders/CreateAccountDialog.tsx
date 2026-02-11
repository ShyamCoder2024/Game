'use client';

// src/components/leaders/CreateAccountDialog.tsx
// Create SM/Master/User dialog with role-based fields

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { X, UserPlus } from 'lucide-react';

interface CreateAccountDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultRole?: string;
}

export function CreateAccountDialog({
    open,
    onClose,
    onSuccess,
    defaultRole = 'user',
}: CreateAccountDialogProps) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [dealPercentage, setDealPercentage] = useState('');
    const [role, setRole] = useState(defaultRole);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/api/leaders/create', {
                name,
                password,
                deal_percentage: Number(dealPercentage),
                role,
            });

            if (!res.success) {
                setError(res.error?.message || 'Failed to create account');
                return;
            }

            // Reset form and close
            setName('');
            setPassword('');
            setDealPercentage('');
            onSuccess();
            onClose();
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fade-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <UserPlus size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Create Account</h3>
                        <p className="text-xs text-slate-500">Add a new member to the platform</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-700">Role</Label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="supermaster">Super Master</option>
                            <option value="master">Master</option>
                            <option value="user">User</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700">Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter full name"
                            className="bg-slate-50"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700">Password</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Set password"
                            className="bg-slate-50"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700">Deal Percentage (%)</Label>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            value={dealPercentage}
                            onChange={(e) => setDealPercentage(e.target.value)}
                            placeholder="e.g. 85"
                            className="bg-slate-50"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
