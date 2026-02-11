'use client';

export function AnnouncementMarquee({ text }: { text: string }) {
    return (
        <div className="overflow-hidden bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <div className="flex">
                <span className="text-amber-600 font-semibold text-xs mr-2 shrink-0">📢</span>
                <div className="overflow-hidden whitespace-nowrap">
                    <p
                        className="text-xs text-amber-700 font-medium inline-block animate-marquee"
                        style={{
                            animation: 'marquee 20s linear infinite',
                        }}
                    >
                        {text}
                    </p>
                </div>
            </div>
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                }
            `}</style>
        </div>
    );
}
