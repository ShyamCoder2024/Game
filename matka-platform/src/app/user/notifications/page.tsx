'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Bell, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Announcement {
    id: number;
    title: string;
    message: string;
    created_at: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get<Announcement[]>('/api/user/announcements');
            if (res.success && res.data) {
                setAnnouncements(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch announcements', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-gray-800">Notifications</h1>
            </div>

            <div className="p-4 space-y-4">
                {loading ? (
                    // Skeleton loader
                    [1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm animate-pulse">
                            <div className="h-4 w-3/4 bg-gray-200 rounded mb-3"></div>
                            <div className="h-3 w-full bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                        </div>
                    ))
                ) : announcements.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Bell size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-1">No Notifications</h3>
                        <p className="text-sm text-gray-500">
                            You have no new notifications from admin.
                        </p>
                    </div>
                ) : (
                    // List
                    announcements.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-gray-800 line-clamp-1">{item.title}</h3>
                                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full whitespace-nowrap">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {item.message}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
