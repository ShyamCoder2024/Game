// server/utils/formatters.ts
// Number and date formatting utilities — Indian format

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

    // Last 3 digits
    let result = str.slice(-3);
    let remaining = str.slice(0, -3);

    // Group remaining digits in pairs
    while (remaining.length > 0) {
        const chunk = remaining.slice(-2);
        remaining = remaining.slice(0, -2);
        result = `${chunk},${result}`;
    }

    return `${isNegative ? '-' : ''}₹${result}`;
}

/**
 * Get today's date in YYYY-MM-DD format in IST
 */
export function getTodayIST(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
}

/**
 * Get current time in HH:MM format in IST
 */
export function getCurrentTimeIST(): string {
    const now = new Date();
    const istOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    return now.toLocaleTimeString('en-IN', istOptions);
}

/**
 * Format Date to IST string
 */
export function formatDateIST(date: Date): string {
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}
