'use client';

// src/components/shared/DataTable.tsx
// Reusable data table — search, sort, pagination, grand total row, export

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIndianCurrency } from '@/lib/utils';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    Download,
} from 'lucide-react';

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    render?: (row: T) => React.ReactNode;
    isCurrency?: boolean;
    grandTotalKey?: string; // key to use for grand total from the grandTotal object
}

interface DataTableProps<T> {
    title: string;
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    totalItems?: number;
    page?: number;
    limit?: number;
    onPageChange?: (page: number) => void;
    onSearch?: (search: string) => void;
    onSort?: (key: string, order: 'asc' | 'desc') => void;
    grandTotal?: Record<string, number>;
    actions?: React.ReactNode;
    rowKey?: (row: T) => string | number;
    onRowClick?: (row: T) => void;
}

export function DataTable<T>({
    title,
    columns,
    data,
    loading = false,
    totalItems = 0,
    page = 1,
    limit = 20,
    onPageChange,
    onSearch,
    onSort,
    grandTotal,
    actions,
    rowKey,
    onRowClick,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const totalPages = Math.ceil(totalItems / limit);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    const handleSort = (key: string) => {
        const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortKey(key);
        setSortOrder(newOrder);
        onSort?.(key, newOrder);
    };

    const handleExportCSV = () => {
        const headers = columns.map((c) => c.label).join(',');
        const rows = data.map((row) =>
            columns
                .map((col) => {
                    const val = (row as Record<string, unknown>)[col.key];
                    return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
                })
                .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        {title}
                        {totalItems > 0 && (
                            <span className="text-sm font-normal text-slate-500 ml-2">
                                ({totalItems} total)
                            </span>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {onSearch && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <Input
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-9 h-9 w-48 bg-slate-50"
                                />
                            </div>
                        )}
                        <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9">
                            <Download size={14} className="mr-1" />
                            CSV
                        </Button>
                        {actions}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={`py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide ${col.align === 'right'
                                            ? 'text-right'
                                            : col.align === 'center'
                                                ? 'text-center'
                                                : 'text-left'
                                            }`}
                                    >
                                        {col.sortable ? (
                                            <button
                                                onClick={() => handleSort(col.key)}
                                                className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                                            >
                                                {col.label}
                                                <ArrowUpDown size={12} />
                                            </button>
                                        ) : (
                                            col.label
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        {columns.map((col) => (
                                            <td key={col.key} className="py-3 px-4">
                                                <Skeleton className="h-4 w-20" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : data.length > 0 ? (
                                data.map((row, i) => (
                                    <tr
                                        key={rowKey ? rowKey(row) : i}
                                        className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''
                                            }`}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`py-3 px-4 ${col.align === 'right'
                                                    ? 'text-right'
                                                    : col.align === 'center'
                                                        ? 'text-center'
                                                        : 'text-left'
                                                    }`}
                                            >
                                                {col.render
                                                    ? col.render(row)
                                                    : col.isCurrency
                                                        ? formatIndianCurrency(
                                                            Number((row as Record<string, unknown>)[col.key]) || 0
                                                        )
                                                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-12 text-center text-slate-400"
                                    >
                                        <div className="flex flex-col items-center justify-center py-6">
                                            <div className="md:w-16 md:h-16 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                                <Search size={24} className="text-slate-400" />
                                            </div>
                                            <p className="text-base font-medium text-slate-600">No data found</p>
                                            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">
                                                We couldn&apos;t find any records matching your criteria.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Grand total row */}
                            {grandTotal && data.length > 0 && (
                                <tr className="grand-total-row">
                                    {columns.map((col, i) => (
                                        <td
                                            key={col.key}
                                            className={`py-3 px-4 text-slate-800 ${col.align === 'right'
                                                ? 'text-right'
                                                : col.align === 'center'
                                                    ? 'text-center'
                                                    : 'text-left'
                                                }`}
                                        >
                                            {i === 0
                                                ? 'Grand Total'
                                                : col.grandTotalKey && grandTotal[col.grandTotalKey] !== undefined
                                                    ? col.isCurrency
                                                        ? formatIndianCurrency(grandTotal[col.grandTotalKey])
                                                        : grandTotal[col.grandTotalKey].toLocaleString('en-IN')
                                                    : ''}
                                        </td>
                                    ))}
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 pt-4 border-t border-slate-200 mt-2">
                        <p className="text-sm text-slate-500">
                            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalItems)} of{' '}
                            {totalItems}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onPageChange?.(1)}
                                disabled={page <= 1}
                            >
                                <ChevronsLeft size={14} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onPageChange?.(page - 1)}
                                disabled={page <= 1}
                            >
                                <ChevronLeft size={14} />
                            </Button>
                            <span className="text-sm text-slate-600 px-3">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onPageChange?.(page + 1)}
                                disabled={page >= totalPages}
                            >
                                <ChevronRight size={14} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onPageChange?.(totalPages)}
                                disabled={page >= totalPages}
                            >
                                <ChevronsRight size={14} />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
