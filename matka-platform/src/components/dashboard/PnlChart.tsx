'use client';

// src/components/dashboard/PnlChart.tsx
// P/L trend chart — 7-day line chart using Recharts

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';

interface PnlChartProps {
    data: { date: string; pnl: number }[];
    loading?: boolean;
}

export function PnlChart({ data, loading }: PnlChartProps) {
    if (loading) {
        return (
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-700">
                        P/L Trend (7 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[280px] flex items-center justify-center text-slate-400">
                        Loading chart...
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-700">
                    P/L Trend (7 Days)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12, fill: '#94A3B8' }}
                                axisLine={{ stroke: '#E2E8F0' }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#94A3B8' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) =>
                                    v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`
                                }
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1E293B',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '13px',
                                }}
                                formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString('en-IN')}`, 'P/L']}
                                labelStyle={{ color: '#94A3B8' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="pnl"
                                stroke="#2563EB"
                                strokeWidth={2.5}
                                fill="url(#pnlGradient)"
                                dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
