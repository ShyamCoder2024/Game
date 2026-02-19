'use client';

// src/components/ui/TimePicker12h.tsx
// Custom 12-hour time picker with AM/PM selector.
// Internally converts to/from HH:MM 24h format for backend compatibility.

import { useMemo } from 'react';

interface TimePicker12hProps {
    value: string;          // HH:MM in 24h format (or '' for empty)
    onChange: (val: string) => void; // emits HH:MM 24h
    required?: boolean;
    className?: string;
    id?: string;
}

/** Convert 24h "HH:MM" to { hour12, minute, period } */
function to12h(val: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
    if (!val) return { hour: '12', minute: '00', period: 'AM' };
    const [hStr, mStr] = val.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const period: 'AM' | 'PM' = h < 12 ? 'AM' : 'PM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return { hour: h.toString(), minute: m, period };
}

/** Convert 12h parts back to 24h "HH:MM" */
function to24h(hour: string, minute: string, period: 'AM' | 'PM'): string {
    let h = parseInt(hour, 10);
    if (period === 'AM') {
        if (h === 12) h = 0;
    } else {
        if (h !== 12) h += 12;
    }
    return `${h.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export function TimePicker12h({ value, onChange, required, className = '', id }: TimePicker12hProps) {
    const parsed = useMemo(() => to12h(value), [value]);

    const handleHour = (h: string) => onChange(to24h(h, parsed.minute, parsed.period));
    const handleMinute = (m: string) => onChange(to24h(parsed.hour, m, parsed.period));
    const handlePeriod = (p: 'AM' | 'PM') => onChange(to24h(parsed.hour, parsed.minute, p));

    const selectBase = `bg-white border border-slate-200 rounded-md px-2 py-2 text-sm text-slate-800
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer ${className}`;

    return (
        <div className="flex items-center gap-1.5" id={id}>
            {/* Hour */}
            <select
                value={parsed.hour}
                onChange={(e) => handleHour(e.target.value)}
                required={required}
                className={`${selectBase} w-16`}
                aria-label="Hour"
            >
                {HOURS.map(h => (
                    <option key={h} value={h}>{h.padStart(2, '0')}</option>
                ))}
            </select>

            <span className="text-slate-500 font-bold text-sm select-none">:</span>

            {/* Minute */}
            <select
                value={parsed.minute}
                onChange={(e) => handleMinute(e.target.value)}
                required={required}
                className={`${selectBase} w-16`}
                aria-label="Minute"
            >
                {MINUTES.map(m => (
                    <option key={m} value={m}>{m}</option>
                ))}
            </select>

            {/* AM/PM */}
            <select
                value={parsed.period}
                onChange={(e) => handlePeriod(e.target.value as 'AM' | 'PM')}
                required={required}
                className={`${selectBase} w-16 font-semibold`}
                aria-label="AM or PM"
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    );
}
