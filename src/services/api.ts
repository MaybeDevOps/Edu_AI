import { useEffect, useState } from 'react'

import type { UserProfile } from '../data/mockData'

export interface AuthResponse {
  token: string
  user: UserProfile
}

export async function loginUser(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = (await response.json()) as { error?: string; token?: string; user?: UserProfile }
  if (!response.ok || !data.token || !data.user) {
    throw new Error(data.error ?? 'Kirishda xatolik yuz berdi.')
  }

  return {
    token: data.token,
    user: data.user,
  }
}

export function useAsync<T>(factory: () => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    factory()
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false, error: null })
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: error.message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [factory])

  return state
}
