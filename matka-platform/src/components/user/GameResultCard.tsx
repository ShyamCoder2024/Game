'use client';

import { BarChart3 } from 'lucide-react';

interface GameResultCardProps {
    gameName: string;
    gameColor: string;
    openPanna: string;
    openSingle: string;
    closePanna: string;
    closeSingle: string;
    jodi: string;
    time: string;
}

// Helper for ordinal date
const getOrdinal = (n: number) => {
    let suffix = 'th';
    if (n % 10 === 1 && n % 100 !== 11) suffix = 'st';
    else if (n % 10 === 2 && n % 100 !== 12) suffix = 'nd';
    else if (n % 10 === 3 && n % 100 !== 13) suffix = 'rd';
    return `${n}${suffix}`;
};

export function GameResultCard({ gameName, gameColor, openPanna, closePanna, jodi, time, openSingle, closeSingle }: GameResultCardProps) {
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const dateStr = `${getOrdinal(day)} ${month}`;

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex h-24">
            {/* Left Side - Colored Box */}
            <div
                className="w-[35%] flex flex-col items-center justify-center p-2 text-white relative"
                style={{ backgroundColor: gameColor }}
            >
                <div className="flex flex-col items-center leading-tight">
                    <span className="text-[10px] font-medium opacity-90 uppercase tracking-wide mb-0.5">{dateStr}</span>
                    <span className="text-sm font-bold whitespace-nowrap">{time}</span>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rotate-45 translate-x-1.5 rounded-[1px]" />
            </div>

            {/* Right Side - Info */}
            <div className="flex-1 p-3 flex flex-col justify-between bg-white relative">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{gameName}</h4>
                    <button className="text-[10px] text-[#059669] font-bold flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
                        <BarChart3 size={10} /> Panel
                    </button>
                </div>

                <div className="flex items-center justify-center">
                    <div className="text-center">
                        <span className="text-lg font-bold text-gray-800 tracking-wider block leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {openPanna || '***'}
                            <span className="mx-1 text-[#059669]">-</span>
                            <span className="text-[#059669] text-xl align-baseline font-extrabold">{jodi || '**'}</span>
                            <span className="mx-1 text-[#059669]">-</span>
                            {closePanna || '***'}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 border-t border-gray-100 pt-1">
                    <span>Open: <span className="text-gray-600 font-medium">{openSingle || '*'}</span></span>
                    <span>Close: <span className="text-gray-600 font-medium">{closeSingle || '*'}</span></span>
                </div>
            </div>
        </div>
    );
}
