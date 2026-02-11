// server/utils/calculation.ts
// Matka math utilities — Single derivation, Jodi calculation, Panna validation

/**
 * Calculate single digit from a panna (3-digit number)
 * Sum all digits, take last digit
 * e.g., 388 → 3+8+8 = 19 → 9
 */
export function calculateSingle(panna: string): number {
    const sum = panna.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    return sum % 10;
}

/**
 * Calculate Jodi from open and close singles
 * Jodi = open_single concatenated with close_single as 2-digit string
 * e.g., open=9, close=0 → "90"
 */
export function calculateJodi(openSingle: number, closeSingle: number): string {
    return `${openSingle}${closeSingle}`;
}

/**
 * Validate panna is a valid 3-digit string
 */
export function isValidPanna(panna: string): boolean {
    return /^\d{3}$/.test(panna);
}

/**
 * Classify panna type based on digit repetition
 * - Single Patti: all 3 digits are different (e.g., 127, 389)
 * - Double Patti: exactly one pair (e.g., 223, 558)
 * - Triple Patti: all digits same (e.g., 000, 111, 999)
 */
export function classifyPanna(panna: string): 'SINGLE_PATTI' | 'DOUBLE_PATTI' | 'TRIPLE_PATTI' {
    const digits = panna.split('');
    const unique = new Set(digits);

    if (unique.size === 1) return 'TRIPLE_PATTI';
    if (unique.size === 2) return 'DOUBLE_PATTI';
    return 'SINGLE_PATTI';
}

/**
 * Validate bet number based on bet type
 */
export function isValidBetNumber(betType: string, betNumber: string): boolean {
    switch (betType) {
        case 'SINGLE_AKDA':
            // Single digit 0-9
            return /^[0-9]$/.test(betNumber);

        case 'SINGLE_PATTI':
            // 3 digits, all different
            if (!/^\d{3}$/.test(betNumber)) return false;
            return classifyPanna(betNumber) === 'SINGLE_PATTI';

        case 'DOUBLE_PATTI':
            // 3 digits, exactly one pair
            if (!/^\d{3}$/.test(betNumber)) return false;
            return classifyPanna(betNumber) === 'DOUBLE_PATTI';

        case 'TRIPLE_PATTI':
            // 3 digits, all same
            if (!/^\d{3}$/.test(betNumber)) return false;
            return classifyPanna(betNumber) === 'TRIPLE_PATTI';

        case 'JODI':
            // 2 digits, 00-99
            return /^\d{2}$/.test(betNumber);

        default:
            return false;
    }
}

/**
 * Check if a bet is a winner
 * Returns true if bet number matches the declared result
 */
export function checkWinner(
    betType: string,
    betNumber: string,
    session: string,
    result: {
        open_panna?: string | null;
        open_single?: number | null;
        close_panna?: string | null;
        close_single?: number | null;
        jodi?: string | null;
    }
): boolean {
    switch (betType) {
        case 'SINGLE_AKDA': {
            // Matches Open Single OR Close Single depending on session
            const targetSingle = session === 'OPEN' ? result.open_single : result.close_single;
            return targetSingle !== null && targetSingle !== undefined && parseInt(betNumber, 10) === targetSingle;
        }

        case 'SINGLE_PATTI':
        case 'DOUBLE_PATTI':
        case 'TRIPLE_PATTI': {
            // Matches Open Panna OR Close Panna depending on session
            const targetPanna = session === 'OPEN' ? result.open_panna : result.close_panna;
            return targetPanna !== null && targetPanna !== undefined && betNumber === targetPanna;
        }

        case 'JODI':
            // Matches calculated Jodi (only available after CLOSE session)
            return result.jodi !== null && result.jodi !== undefined && betNumber === result.jodi;

        default:
            return false;
    }
}
