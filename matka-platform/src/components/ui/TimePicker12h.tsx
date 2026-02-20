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

    // Enhanced Tailwind styling for better UI/UX
    const selectBase = `
        appearance-none bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700
        font-medium shadow-sm transition-all duration-200 ease-in-out
        hover:border-blue-400 hover:bg-white
        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white
        cursor-pointer
        bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
        bg-[length:12px_12px] bg-[position:right_6px_center] bg-no-repeat pr-5
        ${className}
    `;

    return (
        <div className="flex items-center gap-1 group" id={id}>
            {/* Hour */}
            <select
                value={parsed.hour}
                onChange={(e) => handleHour(e.target.value)}
                required={required}
                className={`${selectBase} min-w-[50px] text-center !pr-5`}
                aria-label="Hour"
            >
                {HOURS.map(h => (
                    <option key={h} value={h}>{h.padStart(2, '0')}</option>
                ))}
            </select>

            <span className="text-slate-400 font-medium text-sm select-none group-hover:text-slate-600 transition-colors">:</span>

            {/* Minute */}
            <select
                value={parsed.minute}
                onChange={(e) => handleMinute(e.target.value)}
                required={required}
                className={`${selectBase} min-w-[50px] text-center !pr-5`}
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
                className={`${selectBase} min-w-[54px] font-semibold tracking-wide text-blue-700 bg-blue-50/50 border-blue-100 hover:border-blue-300 !pr-5 text-center`}
                aria-label="AM or PM"
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    );
}
