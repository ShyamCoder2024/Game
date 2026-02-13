'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Target, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
    { label: 'Home', href: '/user', icon: Home },
    { label: 'Bet', href: '/user/bet', icon: Target },
    { label: 'Charts', href: '/user/charts', icon: BarChart3 },
    { label: 'Profile', href: '/user/profile', icon: User },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {tabs.map((tab) => {
                    const isActive = tab.href === '/user'
                        ? pathname === '/user'
                        : pathname.startsWith(tab.href);
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[60px]',
                                isActive
                                    ? 'text-[#003366]'
                                    : 'text-gray-400 hover:text-gray-600'
                            )}
                        >
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                                isActive && 'bg-blue-50 scale-110'
                            )}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={cn(
                                'text-[10px] font-medium',
                                isActive && 'font-bold'
                            )}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
