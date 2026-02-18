import { ShieldCheck } from 'lucide-react';

interface TrustBadgeProps {
    className?: string;
    variant?: 'light' | 'dark';
}

export function TrustBadge({ className = '', variant = 'light' }: TrustBadgeProps) {
    const isDark = variant === 'dark';

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${isDark
                ? 'bg-slate-800/50 border-slate-700 text-slate-300'
                : 'bg-emerald-50 border-emerald-100 text-emerald-700'
            } ${className}`}>
            <ShieldCheck size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
                Trusted by 20,000+ Users in India
            </span>
        </div>
    );
}
