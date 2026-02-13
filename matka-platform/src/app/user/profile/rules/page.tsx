'use client';

import { BookOpen, ShieldCheck, Banknote, Clock, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RulesPage() {
    const rulesConfig = [
        {
            title: 'Game Rates / गेम रेट्स',
            icon: Banknote,
            color: 'text-green-600',
            bg: 'bg-green-50',
            items: [
                { label: 'Single Digit / सिंगल अंक', value: '1 : 10' },
                { label: 'Jodi / जोड़ी', value: '1 : 100' },
                { label: 'Single Patti / सिंगल पत्ती', value: '1 : 160' },
                { label: 'Double Patti / डबल पत्ती', value: '1 : 320' },
                { label: 'Triple Patti / ट्रिपल पत्ती', value: '1 : 700' },
                { label: 'Half Sangam / हाफ संगम', value: '1 : 1000' },
                { label: 'Full Sangam / फुल संगम', value: '1 : 10000' },
            ]
        },
        {
            title: 'Timing & Results / समय और परिणाम',
            icon: Clock,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            content: [
                'Bets must be placed before the market "Open" or "Close" time. / बेट बाजार खुलने या बंद होने से पहले लगाएं।',
                'Results are declared automatically. Please refresh the page if results are delayed. / परिणाम स्वचालित रूप से घोषित किए जाते हैं। यदि परिणाम में देरी हो तो पेज रिफ्रेश करें।',
                'Any bet placed after the official cutoff time will be rejected or refunded. / कटऑफ समय के बाद लगाया गया कोई भी बेट मान्य नहीं होगा।'
            ]
        },
        {
            title: 'General Rules / सामान्य नियम',
            icon: ShieldCheck,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            content: [
                'Minimum deposit valid for betting is ₹300. / सट्टेबाजी के लिए न्यूनतम जमा राशि ₹300 है।',
                'Minimum withdrawal amount is ₹500. / न्यूनतम निकासी राशि ₹500 है।',
                'Withdrawal requests are processed between 10 AM to 10 PM. / निकासी अनुरोध सुबह 10 बजे से रात 10 बजे के बीच प्रोसेस किए जाते हैं।',
                'Multiple IDs for the same user are strictly prohibited. / एक ही उपयोगकर्ता के लिए एक से अधिक आईडी बनाना सख्त मना है।',
                'Management decision is final in case of any disputes. / किसी भी विवाद के मामले में प्रबंधन का निर्णय अंतिम होगा।'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Premium Header */}
            <div className="sticky top-0 z-30 bg-[#003366] text-white shadow-lg">
                <div className="flex items-center gap-4 px-4 py-4 max-w-lg mx-auto">
                    <Link
                        href="/user/profile"
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold tracking-wide">Game Rules</h1>
                        <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">
                            Terms & Conditions
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Intro Card */}
                <div className="bg-gradient-to-br from-[#003366] to-[#004080] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <BookOpen size={20} className="text-yellow-400" />
                            </span>
                            <h2 className="text-lg font-bold">How to Play?</h2>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed">
                            Welcome to All India Bet. Please read the rules carefully to ensure a smooth and fair gaming experience.
                        </p>
                    </div>
                </div>

                {/* Rules Sections */}
                <div className="space-y-4">
                    {rulesConfig.map((section, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={section.title}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2.5 rounded-xl ${section.bg} ${section.color}`}>
                                    <section.icon size={20} />
                                </div>
                                <h3 className="font-bold text-gray-800">{section.title}</h3>
                            </div>

                            {section.items ? (
                                <div className="space-y-2.5">
                                    {section.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                                            <span className="text-gray-600 font-medium">{item.label}</span>
                                            <span className="font-bold text-[#003366] bg-blue-50 px-2 py-0.5 rounded text-xs">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {section.content?.map((text, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                                            <span className="mt-1.5 min-w-[6px] h-1.5 rounded-full bg-gray-300" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Footer Note */}
                <div className="text-center py-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        Play Responsibly • 18+ Only
                    </p>
                </div>
            </div>
        </div>
    );
}
