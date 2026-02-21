'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileSpreadsheet, Calendar, SearchX } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { TRANSACTION_LABELS } from '@/lib/constants';

interface Transaction {
    id: number;
    amount: number;
    type: string;
    note: string;
    created_at: string;
    date: string;
    balance_after: number;
}

type FilterOption = '1M' | '3M' | '6M';

export default function UserStatementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Transaction[]>([]);
    const [activeFilter, setActiveFilter] = useState<FilterOption>('1M');

    const fetchStatement = async (filter: FilterOption) => {
        setLoading(true);
        try {
            const toDate = new Date();
            const fromDate = new Date();

            if (filter === '1M') {
                fromDate.setMonth(fromDate.getMonth() - 1);
            } else if (filter === '3M') {
                fromDate.setMonth(fromDate.getMonth() - 3);
            } else if (filter === '6M') {
                fromDate.setMonth(fromDate.getMonth() - 6);
            }

            // Formatting dates to YYYY-MM-DD for the API
            const dateFromStr = fromDate.toISOString().split('T')[0];
            const dateToStr = toDate.toISOString().split('T')[0];

            const res = await api.get<Transaction[]>('/api/user/ledger', {
                dateFrom: dateFromStr,
                dateTo: dateToStr,
                limit: '500' // Fetch a reasonable amount for the statement
            });

            if (res.success && res.data) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch statement:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatement(activeFilter);
    }, [activeFilter]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Premium Header */}
            <div className="sticky top-0 z-30 bg-[#003366] text-white shadow-lg">
                <div className="flex items-center justify-between px-4 py-4 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-white" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold tracking-wide leading-tight">Account Statement</h1>
                            <p className="text-[10px] text-blue-200 font-bold tracking-widest uppercase">
                                Detailed Logs
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-[#012244] px-4 py-3 border-t border-white/5 shadow-inner">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                            <Calendar size={14} /> Filter
                        </div>
                        <div className="flex bg-[#003366] rounded-lg p-1 border border-white/5">
                            {(['1M', '3M', '6M'] as FilterOption[]).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeFilter === filter
                                            ? 'bg-blue-500 text-white shadow-sm'
                                            : 'text-blue-200 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {filter === '1M' ? '1 Month' : filter === '3M' ? '3 Months' : '6 Months'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Table Container */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header Row (Hidden on very small screens, shown as block on larger) */}
                    <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50 p-4 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-3">Date / Time</div>
                        <div className="col-span-4">Transaction Details</div>
                        <div className="col-span-2 text-right">Debit</div>
                        <div className="col-span-2 text-right">Credit</div>
                        <div className="col-span-1 text-right">Balance</div>
                    </div>

                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-xl bg-gray-100" />
                            ))}
                        </div>
                    ) : data.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-16 h-16 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-4">
                                <SearchX size={32} />
                            </div>
                            <h3 className="text-gray-800 font-bold text-lg mb-1">No Transactions Found</h3>
                            <p className="text-gray-500 text-sm max-w-xs">
                                There are no records for the selected time period. Try a different filter.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 placeholder-opacity-50">
                            {data.map((row) => {
                                const isCredit = row.amount >= 0;
                                const timestamp = row.created_at || row.date;
                                const formattedDate = new Date(timestamp).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                });
                                const formattedTime = new Date(timestamp).toLocaleTimeString('en-IN', {
                                    hour: '2-digit', minute: '2-digit'
                                });

                                const typeLabel = TRANSACTION_LABELS[row.type as keyof typeof TRANSACTION_LABELS] || row.type.replace(/_/g, ' ');

                                return (
                                    <div key={row.id} className="p-4 hover:bg-blue-50/30 transition-colors">

                                        {/* Mobile View (< md) */}
                                        <div className="md:hidden flex flex-col gap-2 relative pl-3">
                                            {/* Status Indicator Line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${isCredit ? 'bg-green-500' : 'bg-red-500'}`} />

                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{typeLabel}</span>
                                                    <p className="text-sm font-bold text-gray-800 mt-0.5">{row.note}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-base font-black ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                                                        {isCredit ? '+' : ''}₹{Math.abs(row.amount).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-50 pt-2 mt-1">
                                                <span>{formattedDate} • {formattedTime}</span>
                                                <span className="font-bold text-[#003366]">Bal: ₹{row.balance_after.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        {/* Desktop Table View (>= md) */}
                                        <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-3 flex flex-col justify-center">
                                                <span className="text-sm font-bold text-gray-800">{formattedDate}</span>
                                                <span className="text-xs text-gray-500 font-medium">{formattedTime}</span>
                                            </div>
                                            <div className="col-span-4 flex flex-col justify-center">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{typeLabel}</span>
                                                <span className="text-sm font-semibold text-gray-800">{row.note}</span>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                {!isCredit ? (
                                                    <span className="text-sm font-black text-red-500">₹{Math.abs(row.amount).toLocaleString('en-IN')}</span>
                                                ) : <span className="text-gray-300">-</span>}
                                            </div>
                                            <div className="col-span-2 text-right">
                                                {isCredit ? (
                                                    <span className="text-sm font-black text-green-600">₹{Math.abs(row.amount).toLocaleString('en-IN')}</span>
                                                ) : <span className="text-gray-300">-</span>}
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <span className="text-sm font-bold text-[#003366]">₹{row.balance_after.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="mt-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-1 bg-gray-200 rounded-full mb-3" />
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                        End of Statement
                    </p>
                </div>
            </div>
        </div>
    );
}
