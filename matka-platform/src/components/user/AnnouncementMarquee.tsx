'use client';

export function AnnouncementMarquee({ text }: { text: string }) {
    return (
        <div className="bg-[#003366] px-3 py-1 shadow-sm relative z-20">
            <div className="flex items-center gap-3">
                <div className="overflow-hidden flex-1 relative h-6">
                    <p
                        className="text-sm text-white font-bold whitespace-nowrap absolute top-1/2 -translate-y-1/2 animate-marquee"
                        style={{
                            animation: 'marquee 15s linear infinite',
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
                    animation: marquee 15s linear infinite;
                }
            `}</style>
        </div>
    );
}
