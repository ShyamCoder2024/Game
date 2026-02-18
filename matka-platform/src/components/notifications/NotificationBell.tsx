'use client';

// src/components/notifications/NotificationBell.tsx
// Bell icon with unread count badge and dropdown for all panels

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';

interface Notification {
    id: number;
    title: string;
    message: string;
    created_at: string;
    creator?: { name: string };
}

const STORAGE_KEY = 'matka_last_read_notification_id';

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get<Notification[]>('/api/notifications');
            if (res.success && res.data) {
                setNotifications(res.data);
                // Calculate unread: notifications newer than last read id
                const lastReadId = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
                const unread = res.data.filter((n) => n.id > lastReadId).length;
                setUnreadCount(unread);
            }
        } catch { /* graceful */ }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleOpen = () => {
        setOpen((prev) => !prev);
        if (!open && notifications.length > 0) {
            // Mark all as read
            const maxId = Math.max(...notifications.map((n) => n.id));
            localStorage.setItem(STORAGE_KEY, String(maxId));
            setUnreadCount(0);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                {unreadCount === 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full opacity-0" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                        {notifications.length > 0 && (
                            <span className="text-xs text-slate-400">{notifications.length} total</span>
                        )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <Bell size={24} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <p className="text-sm font-semibold text-slate-800 mb-0.5">{n.title}</p>
                                    <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
