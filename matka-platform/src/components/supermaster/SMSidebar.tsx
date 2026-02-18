'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Users, UserCheck, Wallet, Scale, Trophy, Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SMSidebarProps {
    open: boolean;
    onClose: () => void;
}

const navItems = [
    { label: 'Masters', href: '/supermaster/masters', icon: Users },
    { label: 'Users', href: '/supermaster/users', icon: UserCheck },
    { label: 'Clients', href: '/supermaster/clients', icon: Wallet },
    { label: 'Settlement', href: '/supermaster/settlement', icon: Scale },
    { label: 'Results', href: '/supermaster/results', icon: Trophy },
    { label: 'Change Password', href: '/supermaster/change-password', icon: Lock },
];

export function SMSidebar({ open, onClose }: SMSidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-[260px] bg-[#1E293B] text-white transition-transform duration-300 flex flex-col',
                    'lg:translate-x-0',
                    open ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
                    <Link href="/supermaster" className="flex items-center gap-3">
                        <span className="text-lg font-bold tracking-tight text-white">All India Bet</span>
                    </Link>
                    <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/10 rounded">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-[#7C3AED] text-white'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                )}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/10 text-xs text-slate-400">
                    All India v1.0
                </div>
            </aside>
        </>
    );
}
