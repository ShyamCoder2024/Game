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

/**
 * Format time to 12-hour format with AM/PM
 * @param timeStr Time string in HH:mm or HH:mm:ss format (e.g., "13:00", "14:30:00")
 */
export function formatTime12Hour(timeStr: string): string {
    if (!timeStr) return '';

    // Check if already in 12-hour format
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;

    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}
