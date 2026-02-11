'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperMasterPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/supermaster/masters');
    }, [router]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]" />
        </div>
    );
}
