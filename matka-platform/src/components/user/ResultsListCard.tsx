'use client';

// src/components/user/ResultsListCard.tsx
// Displays game results with a focus on Open/Close session details

import { Clock } from 'lucide-react';

interface ResultsListCardProps {
    gameName: string;
    gameColor: string;
    openPanna: string;
    openSingle: string;
    closePanna: string;
    closeSingle: string;
    jodi: string;
    time: string;
}

export function ResultsListCard({
    gameName,
    gameColor,
    openPanna,
    openSingle,
    closePanna,
    closeSingle,
    jodi,
    time
}: ResultsListCardProps) {

    const formatValue = (val: string) => val || '*';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition-all duration-300">
            {/* Header / Game Name */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: gameColor }} />
                    <span className="text-sm font-black text-gray-800 tracking-tight uppercase leading-none">
                        {gameName}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500">{time}</span>
                </div>
            </div>

            {/* Result Body */}
            <div className="p-4 grid grid-cols-3 gap-2 items-center">

                {/* OPEN Section */}
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50/50 border border-gray-100 h-full">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Open</span>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-600 font-mono tracking-tight">
                            {formatValue(openPanna)}
                        </span>
                        <span className="w-6 h-6 flex items-center justify-center bg-white text-gray-800 font-bold rounded text-xs border border-gray-200 shadow-sm">
                            {formatValue(openSingle)}
                        </span>
                    </div>
                </div>

                {/* JODI (Result) */}
                <div className="flex flex-col items-center justify-center relative">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-blue-900/10 z-10"
                        style={{ backgroundColor: gameColor }}
                    >
                        {formatValue(jodi)}
                    </div>
                    {/* Connecting Line (visual flair) */}
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-200 -z-0" />
                </div>

                {/* CLOSE Section */}
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50/50 border border-gray-100 h-full">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Close</span>
                    <div className="flex items-center gap-1">
                        <span className="w-6 h-6 flex items-center justify-center bg-white text-gray-800 font-bold rounded text-xs border border-gray-200 shadow-sm">
                            {formatValue(closeSingle)}
                        </span>
                        <span className="text-xs font-bold text-gray-600 font-mono tracking-tight">
                            {formatValue(closePanna)}
                        </span>
                    </div>
                </div>

            </div>

            {/* Aesthetic Decor */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: gameColor, opacity: 0.15 }} />
        </div>
    );
}
