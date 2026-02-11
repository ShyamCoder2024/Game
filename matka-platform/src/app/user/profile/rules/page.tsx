'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { BookMarked, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RulesPage() {
    const [rules, setRules] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<{ content: string }>('/api/content/rules');
            if (res.success && res.data) setRules(res.data.content);
        } catch {
            setRules(`
<h3>📋 Game Rules</h3>
<ol>
  <li><strong>Single Akda (SA)</strong> — Pick a single digit (0-9). Win 10x your bet.</li>
  <li><strong>Single Patti (SP)</strong> — Pick a 3-digit number. Win 160x your bet.</li>
  <li><strong>Double Patti (DP)</strong> — Pick a 3-digit with repeating digits. Win 320x your bet.</li>
  <li><strong>Triple Patti (TP)</strong> — Pick a 3-digit all same digits. Win 70x your bet.</li>
  <li><strong>Jodi (JD)</strong> — Pick a 2-digit number (00-99). Win 100x your bet.</li>
</ol>
<h3>⏰ Timing Rules</h3>
<ul>
  <li>Bets must be placed before the opening time of each game.</li>
  <li>Results are declared at the scheduled closing time.</li>
  <li>No bets accepted for closed games.</li>
</ul>
<h3>💰 Settlement Rules</h3>
<ul>
  <li>Winnings are credited automatically to your wallet.</li>
  <li>Minimum bet amount: ₹10</li>
  <li>Maximum bet amount: depends on your credit limit.</li>
  <li>All transactions are final once confirmed.</li>
</ul>
            `);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchRules(); }, [fetchRules]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Link href="/user/profile" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} /></Link>
                <div className="flex items-center gap-2">
                    <BookMarked size={18} className="text-[#059669]" />
                    <h2 className="text-lg font-bold text-gray-800">Rules</h2>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-6 bg-white rounded animate-pulse" />)}
                </div>
            ) : (
                <div
                    className="bg-white rounded-2xl p-5 prose prose-sm max-w-none prose-headings:text-gray-800 prose-li:text-gray-700 prose-strong:text-[#059669]"
                    dangerouslySetInnerHTML={{ __html: rules }}
                />
            )}
        </div>
    );
}
