import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { assignments as initialAssignments, type Assignment, type Role, type UserProfile } from '../data/mockData'

interface UserSession extends UserProfile {
  token: string
}

interface AppState {
  user: UserSession | null
  token: string | null
  language: 'uz' | 'en' | 'ru'
  theme: 'light' | 'dark'
  assignments: Assignment[]
  login: (user: UserProfile, token: string) => void
  logout: () => void
  gradeAssignment: (id: string, score: number) => void
  setLanguage: (language: 'uz' | 'en' | 'ru') => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useAuthStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      language: 'uz',
      theme: 'light',
      assignments: initialAssignments,
      login: (user, token) => set({ user: { ...user, token }, token }),
      logout: () => set({ user: null, token: null }),
      gradeAssignment: (id, score) =>
        set((state) => ({
          assignments: state.assignments.map((assignment) =>
            assignment.id === id ? { ...assignment, score, status: 'graded' } : assignment,
          ),
        })),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'edu-ai-store',
    },
  ),
)

export type { Role, UserProfile, UserSession }
