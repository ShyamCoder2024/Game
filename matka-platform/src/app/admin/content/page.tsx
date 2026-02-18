'use client';

// src/app/admin/content/page.tsx
// Content management — announcements, banners, rules

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
    Megaphone, BookOpen, Plus, X, Save, Trash2,
} from 'lucide-react';

interface Announcement {
    id: number; title: string; message: string; is_active: boolean; created_at: string;
}

export default function ContentPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [addOpen, setAddOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [rules, setRules] = useState('');
    const [rulesLoading, setRulesLoading] = useState(false);
    const [rulesMsg, setRulesMsg] = useState('');

    const fetchContent = useCallback(async () => {
        setLoading(true);
        try {
            const [annRes, rulesRes] = await Promise.allSettled([
                api.get<Announcement[]>('/api/admin/announcements'),
                api.get<{ content: string }>('/api/admin/rules'),
            ]);
            if (annRes.status === 'fulfilled' && annRes.value.data) setAnnouncements(annRes.value.data);
            if (rulesRes.status === 'fulfilled' && rulesRes.value.data) setRules(rulesRes.value.data.content);
        } catch { /* graceful */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchContent(); }, [fetchContent]);

    const handleAddAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError('');
        setAddLoading(true);
        try {
            const res = await api.post('/api/admin/announcements', { title: newTitle, message: newMessage });
            if (!res.success) {
                setAddError(res.error?.message || 'Failed to post announcement');
                return;
            }
            // Only close on success
            setAddOpen(false); setNewTitle(''); setNewMessage('');
            fetchContent();
        } catch { setAddError('Network error. Please try again.'); } finally { setAddLoading(false); }
    };

    const handleDeleteAnnouncement = async (id: number) => {
        try {
            await api.delete(`/api/admin/announcements/${id}`);
            fetchContent();
        } catch { /* graceful */ }
    };

    const handleSaveRules = async () => {
        setRulesLoading(true); setRulesMsg('');
        try {
            const res = await api.put('/api/admin/rules', { content: rules });
            if (res.success) {
                setRulesMsg('Rules saved successfully!');
                setTimeout(() => setRulesMsg(''), 3000);
            }
        } catch { /* graceful */ } finally { setRulesLoading(false); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Content Management</h1>
                <p className="text-sm text-slate-500 mt-1">Manage announcements, banners, and platform rules</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Announcements */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                <Megaphone size={16} className="text-blue-500" />
                                Announcements
                            </CardTitle>
                            <Button size="sm" onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-8">
                                <Plus size={14} className="mr-1" />Add
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
                            </div>
                        ) : announcements.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {announcements.map((a) => (
                                    <div key={a.id} className="p-3 bg-slate-50 rounded-lg flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-semibold text-slate-700 truncate">{a.title}</h4>
                                                <Badge className={a.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'} >{a.is_active ? 'Active' : 'Hidden'}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2">{a.message}</p>
                                        </div>
                                        <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-400">
                                <Megaphone size={24} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No announcements yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Rules */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <BookOpen size={16} className="text-purple-500" />
                            Platform Rules
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            value={rules}
                            onChange={(e) => setRules(e.target.value)}
                            className="w-full h-[300px] rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter platform rules here..."
                        />
                        {rulesMsg && <p className="text-sm text-green-600 bg-green-50 rounded-lg p-2 mt-2">{rulesMsg}</p>}
                        <Button onClick={handleSaveRules} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" disabled={rulesLoading}>
                            <Save size={14} className="mr-1" />
                            {rulesLoading ? 'Saving...' : 'Save Rules'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Add announcement modal */}
            {addOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <button onClick={() => setAddOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">New Announcement</h3>
                        <form onSubmit={handleAddAnnouncement} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Announcement title" required className="bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <Label>Message</Label>
                                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Announcement message..." required
                                    className="w-full h-24 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {addError && (
                                <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-100">
                                    {addError}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => { setAddOpen(false); setAddError(''); }}>Cancel</Button>
                                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={addLoading}>
                                    {addLoading ? 'Posting...' : 'Post Announcement'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
