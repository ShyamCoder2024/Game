'use client';

// src/components/dashboard/StatCard.tsx
// Dashboard stat card — large number, label, trend indicator

import { Card, CardContent } from '@/components/ui/card';
import { formatIndianCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatCardProps {
    title: string;
    value: number;
    isCurrency?: boolean;
    trend?: number; // percentage change
    icon: React.ElementType;
    iconColor?: string;
    iconBg?: string;
}

export function StatCard({
    title,
    value,
    isCurrency = false,
    trend,
    icon: Icon,
    iconColor = 'text-blue-600',
    iconBg = 'bg-blue-100',
}: StatCardProps) {
    const displayValue = isCurrency ? formatIndianCurrency(value) : value.toLocaleString('en-IN');

    const trendColor =
        trend === undefined || trend === 0
            ? 'text-slate-500'
            : trend > 0
                ? 'text-green-600'
                : 'text-red-600';

    const TrendIcon =
        trend === undefined || trend === 0
            ? Minus
            : trend > 0
                ? TrendingUp
                : TrendingDown;


    // ...

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                            <p
                                className={cn(
                                    'text-2xl lg:text-3xl font-bold tracking-tight',
                                    isCurrency && value < 0 ? 'text-red-600' : 'text-slate-800'
                                )}
                            >
                                {displayValue}
                            </p>
                            {trend !== undefined && (
                                <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trendColor)}>
                                    <TrendIcon size={14} />
                                    <span>{Math.abs(trend).toFixed(1)}% vs yesterday</span>
                                </div>
                            )}
                        </div>
                        <div className={cn('p-3 rounded-xl', iconBg)}>
                            <Icon size={22} className={iconColor} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
