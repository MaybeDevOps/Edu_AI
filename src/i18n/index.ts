export type Language = 'uz' | 'en' | 'ru'

const messages: Record<Language, Record<string, string>> = {
  uz: {
    login: 'Kirish',
    dashboard: 'Dashboard',
    courses: 'Kurslar',
    settings: 'Sozlamalar',
    welcome: 'Xush kelibsiz',
    student: 'Talaba',
    mentor: 'Mentor',
    admin: 'Admin',
  },
  en: {
    login: 'Login',
    dashboard: 'Dashboard',
    courses: 'Courses',
    settings: 'Settings',
    welcome: 'Welcome',
    student: 'Student',
    mentor: 'Mentor',
    admin: 'Admin',
  },
  ru: {
    login: 'Войти',
    dashboard: 'Панель',
    courses: 'Курсы',
    settings: 'Настройки',
    welcome: 'Добро пожаловать',
    student: 'Студент',
    mentor: 'Ментор',
    admin: 'Админ',
  },
}

export function t(key: string, language: Language = 'uz'): string {
  return messages[language][key] ?? key
}

export function getDefaultLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'uz'
  }

  const saved = localStorage.getItem('edu-ai-lang') as Language | null
  if (saved === 'uz' || saved === 'en' || saved === 'ru') {
    return saved
  }

  return 'uz'
}
