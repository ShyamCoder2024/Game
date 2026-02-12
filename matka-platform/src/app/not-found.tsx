'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Ghost, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100"
            >
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{
                        repeat: Infinity,
                        repeatType: 'reverse',
                        duration: 2,
                        ease: 'easeInOut'
                    }}
                    className="mb-6 flex justify-center"
                >
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                        <Ghost size={48} className="text-slate-400" />
                    </div>
                </motion.div>

                <h1 className="text-3xl font-bold text-slate-800 mb-2">Page Not Found</h1>
                <p className="text-slate-500 mb-8">
                    Oops! The page you are looking for seems to have vanished into thin air.
                </p>

                <div className="space-y-3">
                    <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base">
                        <Link href="/">
                            <Home size={18} className="mr-2" />
                            Return Home
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-slate-600 hover:text-slate-900"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Go Back
                    </Button>
                </div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-xs text-slate-400"
            >
                Matka Platform &copy; {new Date().getFullYear()}
            </motion.p>
        </div>
    );
}
