// src/lib/utils.ts
// Shared utility functions for the frontend

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format amount in Indian number system: ₹12,34,567
 */
export function formatIndianCurrency(amount: number): string {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const str = absAmount.toString();

    if (str.length <= 3) {
        return `${isNegative ? '-' : ''}₹${str}`;
    }

    let result = str.slice(-3);
    let remaining = str.slice(0, -3);

    while (remaining.length > 0) {
        const chunk = remaining.slice(-2);
        remaining = remaining.slice(0, -2);
        result = `${chunk},${result}`;
    }

    return `${isNegative ? '-' : ''}₹${result}`;
}

/**
 * Format number in Indian system without currency: 12,34,567
 */
export function formatIndianNumber(num: number): string {
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    const str = absNum.toString();

    if (str.length <= 3) {
        return `${isNegative ? '-' : ''}${str}`;
    }

    let result = str.slice(-3);
    let remaining = str.slice(0, -3);

    while (remaining.length > 0) {
        const chunk = remaining.slice(-2);
        remaining = remaining.slice(0, -2);
        result = `${chunk},${result}`;
    }

    return `${isNegative ? '-' : ''}${result}`;
}

/**
 * Delay for async operations
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
