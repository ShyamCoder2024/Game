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

export function GameResultCard({ gameName, gameColor, openPanna, closePanna, jodi, time, openSingle, closeSingle }: GameResultCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex">
                <div className="w-1" style={{ backgroundColor: gameColor }} />
                <div className="flex-1 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-800">{gameName}</h4>
                        <span className="text-[10px] text-gray-400">{time}</span>
                    </div>
                    <div className="text-center py-1">
                        <span className="text-lg font-bold text-gray-800 tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {openPanna || '***'}
                            {' - '}
                            <span className="text-[#059669] text-base align-super font-extrabold">{jodi || '**'}</span>
                            {' - '}
                            {closePanna || '***'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <div className="flex gap-3 text-[10px] text-gray-400">
                            <span>O: {openSingle || '*'}</span>
                            <span>C: {closeSingle || '*'}</span>
                        </div>
                        <button className="flex items-center gap-1 text-[10px] text-[#059669] font-semibold hover:underline">
                            <BarChart3 size={10} /> चार्ट →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
