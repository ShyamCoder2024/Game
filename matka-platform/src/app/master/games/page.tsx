'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';

export default function MasterGamesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                    <Gamepad2 className="text-[#0891B2]" size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Games Management</h1>
                    <p className="text-sm text-gray-500">Manage game settings and rates</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Game Settings</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Gamepad2 size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 mb-1">Coming Soon</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                        Game management features for Masters are currently under development.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
