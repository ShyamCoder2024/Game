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
    Megaphone, BookOpen, Plus, X, Save, Trash2, Bell, Phone, Image as ImageIcon,
} from 'lucide-react';

interface Announcement {
    id: number; title: string; message: string; is_active: boolean; created_at: string;
}

interface Notification {
    id: number; title: string; message: string; created_at: string; creator?: { name: string };
}

interface Banner {
    id: number; image_url: string; title?: string; display_order: number;
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

    // Notifications state
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifError, setNotifError] = useState('');
    const [notifSuccess, setNotifSuccess] = useState('');

    // WhatsApp state
    const [whatsapp, setWhatsapp] = useState('');
    const [whatsappLoading, setWhatsappLoading] = useState(false);
    const [whatsappMsg, setWhatsappMsg] = useState('');
    const [whatsappError, setWhatsappError] = useState('');

    // Banner state
    const [banners, setBanners] = useState<Banner[]>([]);
    const [bannerUrl, setBannerUrl] = useState('');
    const [bannerTitle, setBannerTitle] = useState('');
    const [bannerOrder, setBannerOrder] = useState('0');
    const [bannerLoading, setBannerLoading] = useState(false);
    const [bannerError, setBannerError] = useState('');

    const fetchContent = useCallback(async () => {
        setLoading(true);
        try {
            const [annRes, rulesRes, notifRes, waRes, bannerRes] = await Promise.allSettled([
                api.get<Announcement[]>('/api/admin/announcements'),
                api.get<{ content: string }>('/api/admin/rules'),
                api.get<Notification[]>('/api/notifications'),
                api.get<{ value: string }>('/api/admin/settings/whatsapp_number'),
                api.get<Banner[]>('/api/admin/banners'),
            ]);
            if (annRes.status === 'fulfilled' && annRes.value.data) setAnnouncements(annRes.value.data);
            if (rulesRes.status === 'fulfilled' && rulesRes.value.data) setRules(rulesRes.value.data.content);
            if (notifRes.status === 'fulfilled' && notifRes.value.data) setNotifications(notifRes.value.data);
            if (waRes.status === 'fulfilled' && waRes.value.data) setWhatsapp(waRes.value.data.value || '');
            if (bannerRes.status === 'fulfilled' && bannerRes.value.data) setBanners(bannerRes.value.data);
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

    const handleCreateNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotifError(''); setNotifSuccess('');
        setNotifLoading(true);
        try {
            const res = await api.post('/api/admin/notifications', { title: notifTitle, message: notifMessage });
            if (!res.success) {
                setNotifError(res.error?.message || 'Failed to create notification');
                return;
            }
            setNotifTitle(''); setNotifMessage('');
            setNotifSuccess('Notification sent!');
            setTimeout(() => setNotifSuccess(''), 3000);
            fetchContent();
        } catch { setNotifError('Network error. Please try again.'); } finally { setNotifLoading(false); }
    };

    const handleDeleteNotification = async (id: number) => {
        try {
            await api.delete(`/api/admin/notifications/${id}`);
            fetchContent();
        } catch { /* graceful */ }
    };

    const handleSaveWhatsapp = async () => {
        setWhatsappError('');
        if (whatsapp.length !== 10) {
            setWhatsappError('WhatsApp number must be exactly 10 digits.');
            return;
        }
        setWhatsappLoading(true); setWhatsappMsg('');
        try {
            const res = await api.put('/api/admin/settings/whatsapp_number', { value: whatsapp });
            if (res.success) {
                setWhatsappMsg('WhatsApp number saved!');
                setTimeout(() => setWhatsappMsg(''), 3000);
            }
        } catch { /* graceful */ } finally { setWhatsappLoading(false); }
    };

    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        setBannerError('');
        if (!bannerUrl.trim()) { setBannerError('Image URL is required.'); return; }
        setBannerLoading(true);
        try {
            const res = await api.post('/api/admin/banners', {
                image_url: bannerUrl.trim(),
                title: bannerTitle.trim() || undefined,
                display_order: parseInt(bannerOrder, 10) || 0,
            });
            if (!res.success) { setBannerError(res.error?.message || 'Failed to add banner'); return; }
            setBannerUrl(''); setBannerTitle(''); setBannerOrder('0');
            fetchContent();
        } catch { setBannerError('Network error. Please try again.'); } finally { setBannerLoading(false); }
    };

    const handleDeleteBanner = async (id: number) => {
        try {
            await api.delete(`/api/admin/banners/${id}`);
            fetchContent();
        } catch { /* graceful */ }
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

                {/* Notifications */}
                <Card className="border-0 shadow-md lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <Bell size={16} className="text-orange-500" />
                            Push Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Create form */}
                            <form onSubmit={handleCreateNotification} className="space-y-3">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={notifTitle}
                                        onChange={(e) => setNotifTitle(e.target.value)}
                                        placeholder="Notification title"
                                        required
                                        className="bg-slate-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Message</Label>
                                    <textarea
                                        value={notifMessage}
                                        onChange={(e) => setNotifMessage(e.target.value)}
                                        placeholder="Notification message..."
                                        required
                                        className="w-full h-20 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                {notifError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{notifError}</p>}
                                {notifSuccess && <p className="text-sm text-green-600 bg-green-50 rounded-lg p-2">{notifSuccess}</p>}
                                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={notifLoading}>
                                    <Bell size={14} className="mr-1" />
                                    {notifLoading ? 'Sending...' : 'Send Notification'}
                                </Button>
                            </form>

                            {/* Existing notifications */}
                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-6 text-center text-slate-400">
                                        <Bell size={20} className="mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : notifications.map((n) => (
                                    <div key={n.id} className="p-3 bg-slate-50 rounded-lg flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-700 truncate">{n.title}</p>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                                        </div>
                                        <button onClick={() => handleDeleteNotification(n.id)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 flex-shrink-0">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
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

            {/* WhatsApp Number Management */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <Phone size={16} className="text-green-500" />
                        WhatsApp Number
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500 mb-3">Enter the 10-digit Indian mobile number (without country code) shown to users for support.</p>
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Input
                                value={whatsapp}
                                onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setWhatsapp(digits);
                                    setWhatsappError('');
                                }}
                                placeholder="9876543210"
                                inputMode="numeric"
                                maxLength={10}
                                className={`bg-slate-50 pr-14 ${whatsappError ? 'border-red-300 focus:ring-red-200' : ''}`}
                            />
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums ${whatsapp.length === 10 ? 'text-green-500' : 'text-slate-400'
                                }`}>
                                {whatsapp.length}/10
                            </span>
                        </div>
                        <Button
                            onClick={handleSaveWhatsapp}
                            disabled={whatsappLoading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Save size={14} className="mr-1" />
                            {whatsappLoading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                    {whatsappError && <p className="text-sm text-red-600 mt-2">{whatsappError}</p>}
                    {whatsappMsg && <p className="text-sm text-green-600 mt-2 font-medium">{whatsappMsg}</p>}
                </CardContent>
            </Card>
            {/* Banner Management — full width */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <ImageIcon size={16} className="text-purple-500" />
                        Manage Banners
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Add Banner Form */}
                    <form onSubmit={handleAddBanner} className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Add New Banner</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-3 space-y-1">
                                <Label className="text-xs">Image URL <span className="text-red-400">*</span></Label>
                                <Input
                                    type="url"
                                    placeholder="https://example.com/banner.jpg"
                                    value={bannerUrl}
                                    onChange={(e) => setBannerUrl(e.target.value)}
                                    className="bg-white"
                                />
                                <p className="text-xs text-slate-400">Recommended: 9:16 ratio (1080×1920 pixels)</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Title (optional)</Label>
                                <Input placeholder="Banner title" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} className="bg-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Display Order</Label>
                                <Input type="number" min="0" value={bannerOrder} onChange={(e) => setBannerOrder(e.target.value)} className="bg-white w-24" />
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" disabled={bannerLoading} className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                                    <Plus size={14} className="mr-1" />
                                    {bannerLoading ? 'Saving...' : 'Save Banner'}
                                </Button>
                            </div>
                        </div>
                        {bannerError && <p className="text-sm text-red-600 mt-2">{bannerError}</p>}
                    </form>

                    {/* Existing Banners */}
                    {banners.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No banners added yet</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {banners.map((b) => (
                                <div key={b.id} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                    {/* 9:16 portrait wrapper */}
                                    <div className="relative w-full" style={{ paddingBottom: '177.78%' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={b.image_url}
                                            alt={b.title || `Banner ${b.id}`}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE3NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXNpemU9IjEyIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='; }}
                                        />
                                    </div>
                                    {/* Overlay with info + delete */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col justify-between p-2">
                                        <button
                                            onClick={() => handleDeleteBanner(b.id)}
                                            className="self-end opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all"
                                        >
                                            <X size={12} />
                                        </button>
                                        <div className="opacity-0 group-hover:opacity-100 transition-all">
                                            {b.title && <p className="text-white text-xs font-medium truncate">{b.title}</p>}
                                            <p className="text-white/70 text-xs">Order: {b.display_order}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
