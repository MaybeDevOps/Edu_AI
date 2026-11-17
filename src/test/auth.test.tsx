import { describe, expect, it } from 'vitest'

import { t } from '../i18n'
import { useAuthStore } from '../store/appStore'

describe('auth flow', () => {
  it('logs in users and preserves their role', () => {
    useAuthStore.setState({ user: null, token: null })
    useAuthStore.getState().login(
      {
        id: 'u-student',
        name: 'Aziza Karimova',
        username: 'aziza',
        role: 'student',
        email: 'aziza@edu-ai.uz',
      },
      'demo-token',
    )

    expect(useAuthStore.getState().user?.role).toBe('student')
    expect(useAuthStore.getState().token).toBe('demo-token')
  })

  it('grades assignments and updates payload', () => {
    useAuthStore.setState({ assignments: [{ id: 'a1', title: 'Test task', student: 'Aziza', score: 50, status: 'pending' }] })

    useAuthStore.getState().gradeAssignment('a1', 92)

    expect(useAuthStore.getState().assignments[0]?.score).toBe(92)
    expect(useAuthStore.getState().assignments[0]?.status).toBe('graded')
  })

  it('falls back to key name when translation is missing', () => {
    expect(t('missing_key', 'uz')).toBe('missing_key')
  })
})
