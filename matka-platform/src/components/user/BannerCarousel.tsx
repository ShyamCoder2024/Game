'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
    id: number;
    image: string;
    alt: string;
}

const banners: Banner[] = [
    {
        id: 1,
        image: '/banners/PHOTO-2026-02-12-14-01-52.jpg',
        alt: 'Welcome to All India Bet'
    },
    {
        id: 2,
        image: '/banners/PHOTO-2026-02-13-00-08-32.jpg',
        alt: 'Trusted Casino & Betting Platform'
    },
    {
        id: 3,
        image: '/banners/PHOTO-2026-02-13-00-08-55.jpg',
        alt: 'Matka Rates'
    },
    {
        id: 4,
        image: '/banners/PHOTO-2026-02-13-00-13-26.jpg',
        alt: 'T20 World Cup Live'
    }
];

export function BannerCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    return (
        <div className="relative w-full aspect-video overflow-hidden shadow-lg group">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    <div className="relative w-full h-full bg-[#003366]"> {/* Fallback color */}
                        {/* Images will be served from public/banners/ or similar. 
                           For now, using the generated image path logic in mind. 
                           We might need to adjust src based on where we save the images. 
                           Assumption: Images are moved to public/banners 
                       */}
                        <Image
                            src={banners[currentIndex].image}
                            alt={banners[currentIndex].alt}
                            fill
                            className="object-fill"
                            priority
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronLeft size={20} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
