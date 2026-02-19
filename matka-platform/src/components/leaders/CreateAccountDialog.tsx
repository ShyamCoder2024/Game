'use client';

// src/components/leaders/CreateAccountDialog.tsx
// Redesigned Create Account dialog — auto-generated ID preview, prominent special status, improved layout

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { X, UserPlus, CheckCircle2, Star, Crown, Shield, User, Info } from 'lucide-react';

interface CreateAccountDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultRole?: string;
}

// Role metadata for display
const ROLE_META: Record<string, { label: string; icon: React.ElementType; prefix: string; color: string; bg: string }> = {
    supermaster: { label: 'Super Master', icon: Crown, prefix: 'SM', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    master: { label: 'Master', icon: Shield, prefix: 'MA', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    user: { label: 'User', icon: User, prefix: 'US', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
};

export function CreateAccountDialog({
    open,
    onClose,
    onSuccess,
    defaultRole = 'user',
}: CreateAccountDialogProps) {
    // Basic fields
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(defaultRole);

    // Rate fields
    const [dealPercentage, setDealPercentage] = useState('');
    const [myMatkaShare, setMyMatkaShare] = useState('');
    const [agentMatkaShare, setAgentMatkaShare] = useState('');
    const [matkaCommission, setMatkaCommission] = useState('');

    // Limit fields
    const [creditLimit, setCreditLimit] = useState('');
    const [fixLimit, setFixLimit] = useState('');

    // Special
    const [isSpecial, setIsSpecial] = useState(false);
    const [specialNotes, setSpecialNotes] = useState('');

    // Initial credit (optional, applied after account creation)
    const [initialCredit, setInitialCredit] = useState('');

    // State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdUserId, setCreatedUserId] = useState<string | null>(null);

    // Reset form whenever dialog opens
    useEffect(() => {
        if (open) {
            setName(''); setPassword(''); setRole(defaultRole);
            setDealPercentage(''); setMyMatkaShare(''); setAgentMatkaShare(''); setMatkaCommission('');
            setCreditLimit(''); setFixLimit('');
            setIsSpecial(false); setSpecialNotes('');
            setInitialCredit('');
            setError(''); setCreatedUserId(null);
        }
    }, [open, defaultRole]);

    const handleClose = () => {
        setError('');
        setCreatedUserId(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Step 1: Create account
            const res = await api.post<{ id: number; user_id: string }>('/api/leaders/create', {
                name,
                password,
                role,
                deal_percentage: Number(dealPercentage) || 0,
                my_matka_share: Number(myMatkaShare) || 0,
                agent_matka_share: Number(agentMatkaShare) || 0,
                matka_commission: Number(matkaCommission) || 0,
                credit_limit: Number(creditLimit) || 0,
                fix_limit: Number(fixLimit) || 0,
                is_special: isSpecial,
                special_notes: specialNotes || undefined,
            });

            if (!res.success) {
                setError(res.error?.message || 'Failed to create account. Please try again.');
                return;
            }

            const newUser = res.data;

            // Step 2: Optional initial credit
            if (initialCredit && Number(initialCredit) > 0 && newUser?.id) {
                await api.post('/api/wallet/credit', {
                    user_id: newUser.id,
                    amount: Number(initialCredit),
                    notes: 'Initial credit on account creation',
                });
            }

            // Show success with generated user_id
            setCreatedUserId(newUser?.user_id || 'Created');
            onSuccess();
        } catch {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const roleMeta = ROLE_META[role] || ROLE_META.user;
    const RoleIcon = roleMeta.icon;

    // Success state
    if (createdUserId) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Account Created!</h3>
                    <p className="text-sm text-slate-500 mb-1">New {roleMeta.label} added successfully.</p>
                    <div className="bg-slate-50 rounded-lg p-3 my-4 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Generated User ID</p>
                        <p className="text-xl font-bold text-blue-600 tracking-wider">{createdUserId}</p>
                    </div>
                    {initialCredit && Number(initialCredit) > 0 && (
                        <p className="text-xs text-green-600 mb-4">₹{Number(initialCredit).toLocaleString('en-IN')} credited to wallet</p>
                    )}
                    <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Done
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                            <UserPlus size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800">Create Account</h3>
                            <p className="text-xs text-slate-500">User ID is auto-generated by the system</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Role + Name */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Basic Info</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">Role</Label>
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
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">Full Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" className="bg-slate-50" required />
                            </div>
                        </div>

                        {/* Auto-generated ID preview */}
                        <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${roleMeta.bg}`}>
                            <div className={`w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                                <RoleIcon size={14} className={roleMeta.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-600">Auto-generated User ID</p>
                                <p className={`text-sm font-bold font-mono ${roleMeta.color}`}>
                                    {roleMeta.prefix}xxxxxx <span className="font-normal text-slate-400 text-xs">(assigned on creation)</span>
                                </p>
                            </div>
                            <Info size={14} className="text-slate-400 shrink-0" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-slate-700 text-sm">Password</Label>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="bg-slate-50" required minLength={6} />
                        </div>
                    </div>

                    {/* Rates */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rates & Shares</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">Deal %</Label>
                                <Input type="number" min="0" max="100" value={dealPercentage} onChange={(e) => setDealPercentage(e.target.value)} placeholder="0" className="bg-slate-50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">My Matka Share %</Label>
                                <Input type="number" min="0" max="100" value={myMatkaShare} onChange={(e) => setMyMatkaShare(e.target.value)} placeholder="0" className="bg-slate-50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">Agent Matka Share %</Label>
                                <Input type="number" min="0" max="100" value={agentMatkaShare} onChange={(e) => setAgentMatkaShare(e.target.value)} placeholder="0" className="bg-slate-50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">Matka Commission %</Label>
                                <Input type="number" min="0" max="100" value={matkaCommission} onChange={(e) => setMatkaCommission(e.target.value)} placeholder="0" className="bg-slate-50" />
                            </div>
                        </div>
                    </div>

                    {/* Limits */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Limits</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">Credit Limit (₹)</Label>
                                <Input type="number" min="0" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="0" className="bg-slate-50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">Fix Limit (₹)</Label>
                                <Input type="number" min="0" value={fixLimit} onChange={(e) => setFixLimit(e.target.value)} placeholder="0" className="bg-slate-50" />
                            </div>
                        </div>
                    </div>

                    {/* Special Status */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Special Status</p>
                        <div
                            onClick={() => setIsSpecial(!isSpecial)}
                            className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all ${isSpecial
                                    ? 'border-amber-400 bg-amber-50'
                                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                }`}
                        >
                            <div className={`w-10 h-6 rounded-full transition-colors relative ${isSpecial ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isSpecial ? 'translate-x-5' : 'translate-x-1'}`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                    <Star size={13} className={isSpecial ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
                                    <span className={`text-sm font-medium ${isSpecial ? 'text-amber-700' : 'text-slate-600'}`}>
                                        {isSpecial ? 'Special Member Enabled' : 'Mark as Special Member'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Special members get priority support and are listed separately</p>
                            </div>
                        </div>
                        {isSpecial && (
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 text-sm">Special Notes</Label>
                                <Input value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} placeholder="Optional notes about this member" className="bg-amber-50 border-amber-200" />
                            </div>
                        )}
                    </div>

                    {/* Initial Credit */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Initial Credit <span className="normal-case font-normal text-slate-400">(Optional)</span></p>
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 text-sm">Credit Amount (₹)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={initialCredit}
                                onChange={(e) => setInitialCredit(e.target.value)}
                                placeholder="Leave blank for no initial credit"
                                className="bg-slate-50"
                            />
                            {initialCredit && Number(initialCredit) > 0 && (
                                <p className="text-xs text-green-600">₹{Number(initialCredit).toLocaleString('en-IN')} will be credited after account creation</p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
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
