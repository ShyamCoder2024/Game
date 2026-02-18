'use client';

// src/components/master/MasterSidebar.tsx
// Master Sidebar: Desktop + Mobile responsive with smooth transitions

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    LayoutDashboard,
    Users,
    Gamepad2,
    UserPlus,
    Scale,
    FileText,
    Settings,
    ChevronDown,
    User,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MasterSidebarProps {
    open: boolean;
    onClose: () => void;
}

interface NavItem {
    label: string;
    href?: string;
    icon: React.ElementType;
    children?: { label: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/master', icon: LayoutDashboard },
    {
        label: 'Users',
        icon: Users,
        children: [
            { label: 'Users', href: '/master/users', icon: User },
        ],
    },
    { label: 'Games', href: '/master/games', icon: Gamepad2 },
    { label: 'Clients', href: '/master/clients', icon: UserPlus },
    { label: 'Results', href: '/master/results', icon: FileText },
    { label: 'Settlement', href: '/master/settlement', icon: Scale },
    { label: 'Content', href: '/master/content', icon: FileText },
    { label: 'Settings', href: '/master/settings', icon: Settings },
];

export function MasterSidebar({ open, onClose }: MasterSidebarProps) {
    const pathname = usePathname();
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['Users']);

    const toggleMenu = (label: string) => {
        setExpandedMenus((prev) =>
            prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
        );
    };

    const isActive = (href: string) => {
        if (href === '/master') return pathname === '/master';
        return pathname.startsWith(href);
    };

    // Helper to close on mobile only
    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-slate-800 text-white flex flex-col transition-transform duration-300 lg:translate-x-0',
                    open ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo header */}
                <div className="flex items-center justify-between h-16 px-5 border-b border-slate-700">
                    <Link href="/master" className="flex items-center gap-3">
                        <span className="text-lg font-bold tracking-tight text-white">All India Bet</span>
                    </Link>
                    <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => {
                        if (item.children) {
                            const isExpanded = expandedMenus.includes(item.label);
                            const hasActiveChild = item.children.some((child) =>
                                isActive(child.href)
                            );

                            return (
                                <div key={item.label}>
                                    <button
                                        onClick={() => toggleMenu(item.label)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                            hasActiveChild
                                                ? 'text-white bg-slate-700/50'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                        )}
                                    >
                                        <item.icon size={18} />
                                        <span className="flex-1 text-left">{item.label}</span>
                                        <ChevronDown
                                            size={16}
                                            className={cn(
                                                'transition-transform duration-300',
                                                isExpanded && 'rotate-180'
                                            )}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-1 ml-4 pl-3 border-l border-slate-700 space-y-1">
                                                    {item.children.map((child) => (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            onClick={handleLinkClick}
                                                            className={cn(
                                                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                                                isActive(child.href)
                                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                                            )}
                                                        >
                                                            <child.icon size={16} />
                                                            <span>{child.label}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href!}
                                onClick={handleLinkClick}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive(item.href!)
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                )}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700">
                    <p className="text-xs text-slate-500 text-center">
                        All India v1.0
                    </p>
                </div>
            </aside>
        </>
    );
}
