// src/store/authStore.ts
// Zustand store for authentication state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
    id: number;
    user_id: string;
    name: string;
    role: 'admin' | 'supermaster' | 'master' | 'user';
}

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;

    // Actions
    login: (user: AuthUser, token: string) => void;
    logout: () => void;
    updateUser: (updates: Partial<AuthUser>) => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            _hasHydrated: false,

            setHasHydrated: (state) => set({ _hasHydrated: state }),

            login: (user, token) => {
                // Also store token in localStorage for API client
                if (typeof window !== 'undefined') {
                    localStorage.setItem('matka_token', token);
                }
                set({ user, token, isAuthenticated: true });
            },

            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('matka_token');
                }
                set({ user: null, token: null, isAuthenticated: false });
            },

            updateUser: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                }));
            },
        }),
        {
            name: 'matka-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
