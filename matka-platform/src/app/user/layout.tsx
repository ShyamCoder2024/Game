import type { Metadata } from 'next';
import { ClientLayout } from './ClientLayout';

// Override global metadata for user pages
export const metadata: Metadata = {
    title: 'User | All India',
    icons: {
        icon: 'data:image/x-icon;base64,', // Empty data URL to remove favicon
        shortcut: 'data:image/x-icon;base64,',
        apple: 'data:image/x-icon;base64,',
    },
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return <ClientLayout>{children}</ClientLayout>;
}
