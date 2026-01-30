import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: number
    email: string
    full_name: string
    role: string
}

interface AuthState {
    user: User | null
    accessToken: string | null
    isAuthenticated: boolean
    login: (user: User, accessToken: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            login: (user, accessToken) =>
                set({ user, accessToken, isAuthenticated: true }),
            logout: () =>
                set({ user: null, accessToken: null, isAuthenticated: false }),
        }),
        {
            name: 'bris-auth',
        }
    )
)
