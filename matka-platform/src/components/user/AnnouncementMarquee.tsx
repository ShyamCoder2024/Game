'use client';

export function AnnouncementMarquee({ text }: { text: string }) {
    return (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-100 border-b border-yellow-200 px-3 py-1.5 shadow-sm relative z-20">
            <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-1.5 rounded-full shrink-0 animate-pulse">
                    <span className="text-sm">📢</span>
                </div>
                <div className="overflow-hidden flex-1 relative h-6">
                    <p
                        className="text-sm text-amber-900 font-bold whitespace-nowrap absolute top-1/2 -translate-y-1/2 animate-marquee"
                        style={{
                            animation: 'marquee 25s linear infinite',
                        }}
                    >
                        {text}
                    </p>
                </div>
            </div>
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translate(100%, -50%); }
                    100% { transform: translate(-100%, -50%); }
                }
                .animate-marquee {
                    animation: marquee 25s linear infinite;
                }
            `}</style>
        </div>
    );
}
