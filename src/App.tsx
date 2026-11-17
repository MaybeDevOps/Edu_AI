import { motion } from 'motion/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { createBrowserRouter, Link, Navigate, NavLink, Outlet, RouterProvider } from 'react-router-dom'
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  Crown,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Search,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { courses, demoUsers, type Role } from './data/mockData'
import { t } from './i18n'
import { loginUser } from './services/api'
import { useAuthStore } from './store/appStore'

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

type LoginFormValues = z.infer<typeof loginSchema>

type TutorMessage = { role: 'user' | 'assistant'; text: string }

function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <Crown className="h-5 w-5" /> Edu_AI
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href="#about">Biz haqimizda</a>
          <a href="#features">Imkoniyatlar</a>
          <a href="#courses">Kurslar</a>
          <a href="#reviews">Foydalanuvchilar fikri</a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="rounded-xl border px-3 py-2 text-sm" aria-label="Qidirish">
            <Search className="h-4 w-4" />
          </button>
          <Link to="/login" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
            Kirish
          </Link>
        </div>
      </div>
    </header>
  )
}

function TutorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<TutorMessage[]>([
    { role: 'assistant', text: 'Salom! Bugun qaysi mavzuda yordam kerak?' },
  ])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (open) {
      textareaRef.current?.focus()
    }
  }, [open])

  const sendPrompt = async () => {
    const text = input.trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', text }].map((message) => ({
            role: message.role,
            text: message.text,
          })),
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let stream = ''

      if (!response.ok || !reader) {
        throw new Error('AI xizmati hozircha ishlamayapti')
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        stream += chunk
          .split('\n\n')
          .filter(Boolean)
          .map((part) => {
            const trimmed = part.trim()
            if (trimmed === 'data: [DONE]') return ''
            if (trimmed.startsWith('data: ')) {
              try {
                const payload = JSON.parse(trimmed.slice(5))
                return payload.token ?? payload.error ?? ''
              } catch {
                return ''
              }
            }
            return ''
          })
          .join('')
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: stream || 'AI javob qoldi.' }])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI xizmati ishlamadi.'
      setMessages((prev) => [...prev, { role: 'assistant', text: message }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary">AI Tutor</div>
            <h3 className="text-xl font-bold">Sun'iy intellekt yordamchisi</h3>
          </div>
          <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={onClose} aria-label="Yopish">
            ✕
          </button>
        </div>
        <div className="max-h-[420px] space-y-3 overflow-y-auto p-5">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.role === 'user' ? 'ml-auto bg-primary text-white' : 'bg-slate-100 text-slate-700'}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex gap-2">
            {['Dasturlash', 'Nazariya', 'Plan'].map((chip) => (
              <button key={chip} type="button" className="rounded-full border border-slate-200 px-3 py-1 text-xs" onClick={() => setInput(chip)}>
                {chip}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-[80px] flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Savolingni yozing..."
            />
            <button
              type="button"
              disabled={loading || !input.trim()}
              className="rounded-2xl bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50"
              onClick={sendPrompt}
            >
              {loading ? 'Yuborilmoqda...' : 'Yubor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LandingPage() {
  const [tutorOpen, setTutorOpen] = useState(false)

  return (
    <>
      <TutorModal open={tutorOpen} onClose={() => setTutorOpen(false)} />
      <div className="min-h-screen bg-background text-slate-900">
        <TopNav />
        <main>
          <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
            <div>
              <span className="inline-flex rounded-full border border-primary/20 bg-primary-fixed px-3 py-1 text-sm font-medium text-primary">AI ta'lim platformasi</span>
              <h1 className="mt-6 font-display text-5xl font-bold leading-tight text-slate-900">
                Kelajak bilimlarini <span className="text-primary">Sun'iy Intellekt</span> bilan o'zlashtiring
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-600">
                Edu_AI bilan personalizatsiyalangan o'quv yo'li, mentorlar bilan ishlash va real AI tahlillar.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/login" className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/20">Boshlash</Link>
                <button type="button" onClick={() => setTutorOpen(true)} className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold">AI Tutor</button>
              </div>
              <div className="mt-12 flex gap-8 text-sm text-slate-500">
                <div><div className="text-3xl font-bold text-slate-900">12k+</div><div>Talaba</div></div>
                <div><div className="text-3xl font-bold text-slate-900">96%</div><div>Qoniqish</div></div>
                <div><div className="text-3xl font-bold text-slate-900">4.9</div><div>Baholash</div></div>
              </div>
            </div>
            <div className="relative">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Bugun</span>
                  <div className="flex items-center gap-2 text-sm text-emerald-600"><Sparkles className="h-4 w-4" /> +240 XP</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-primary-fixed p-4">
                    <div className="text-sm text-slate-600">Mastery</div>
                    <div className="mt-2 text-3xl font-bold text-primary">89%</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-600">Streak</div>
                    <div className="mt-2 text-3xl font-bold text-slate-900">12 kun</div>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-semibold">Next lesson</span>
                    <span className="text-xs text-slate-500">Today 18:30</span>
                  </div>
                  <div className="text-lg font-bold">React state management</div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div className="h-2 w-3/4 rounded-full bg-primary" />
                  </div>
                </div>
              </motion.div>
              <button type="button" onClick={() => setTutorOpen(true)} className="absolute -bottom-6 left-6 rounded-2xl bg-slate-900 px-4 py-3 text-left text-white shadow-xl">
                <div className="text-xs text-slate-300">AI Tutor</div>
                <div className="text-lg font-semibold">Ready</div>
              </button>
            </div>
          </section>

          <section id="about" className="bg-slate-50 py-16">
            <div className="mx-auto max-w-7xl px-6">
              <h2 className="text-center text-3xl font-bold">Nega Edu_AI?</h2>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {[{ title: 'Shaxsiy yo\'nalish', text: 'Har bir talaba uchun moslashgan o\'quv yo\'li' }, { title: 'Mentorlik', text: 'Amaliy ko\'rsatmalar va tezkor fikr-mulohazalar' }, { title: 'AI yordam', text: 'Yakuniy natijalar va kognitiv baholash' }].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="mt-3 text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="features" className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-center text-3xl font-bold">AI imkoniyatlari</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-primary p-8 text-white">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10"><Sparkles className="h-5 w-5" /></div>
                <h3 className="text-2xl font-bold">Tahlilchi</h3>
                <p className="mt-3 text-white/80">Progress va muammolarni aniq tahlil qiladi, qo'shimcha ustunliklarni ko'rsatadi.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><BriefcaseBusiness className="h-5 w-5" /></div>
                <h3 className="text-2xl font-bold">Aqlli yo'riqnoma</h3>
                <p className="mt-3 text-slate-600">Maqsadga yo'naltirilgan o'quv rejalari va kunlik mashg'ulotlar tayyorlaydi.</p>
              </div>
            </div>
          </section>

          <section id="courses" className="bg-slate-50 py-16">
            <div className="mx-auto max-w-7xl px-6">
              <h2 className="text-center text-3xl font-bold">Mashhur yo'nalishlar</h2>
              <div className="mt-10 grid gap-6 md:grid-cols-4">
                {['Dasturlash', 'Dizayn', 'Biznes', 'Marketing'].map((category, index) => (
                  <div key={category} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary">{index + 1}</div>
                    <h3 className="text-xl font-bold">{category}</h3>
                    <p className="mt-2 text-slate-600">{[24, 18, 12, 15][index]} ta kurs</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="reviews" className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-center text-3xl font-bold">Foydalanuvchilar fikri</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { name: 'Shahnoza', text: "Platforma juda qulay, AI ko'rsatmalari real foyda berdi." },
                { name: 'Ilyos', text: "Mentorlik va kurslar o'quv jarayonini ancha tezlashtirdi." },
                { name: 'Nargiza', text: "Yangi bilimlarni o'zlashtirishdagi barchasi to'liq, chiroyli." },
              ].map((quote) => (
                <div key={quote.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-slate-600">“{quote.text}”</p>
                  <div className="mt-4 font-semibold text-primary">{quote.name}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
        <footer className="border-t border-slate-200 bg-white py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
            <div className="flex items-center gap-2 font-bold text-primary"><Crown className="h-5 w-5" /> Edu_AI</div>
            <div className="flex gap-6 text-sm text-slate-600">
              <a href="#about">Biz haqimizda</a>
              <a href="#features">Imkoniyatlar</a>
              <a href="#courses">Kurslar</a>
            </div>
            <div className="text-sm text-slate-500">© {new Date().getFullYear()} Edu_AI</div>
          </div>
        </footer>
      </div>
    </>
  )
}

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('student')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((state) => state.login)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true)
    setError('')

    try {
      const response = await loginUser(values.username, values.password)
      login(response.user, response.token)
      window.location.assign(`/${response.user.role}`)
    } catch (submitError) {
      const fallback = demoUsers.find((user) => user.username === values.username)
      const validPasswords: Record<Role, string> = {
        student: 'Student123!',
        mentor: 'Mentor123!',
        admin: 'Admin123!',
      }

      if (fallback && values.password === validPasswords[fallback.role]) {
        login(fallback, 'demo-token')
        window.location.assign(`/${fallback.role}`)
        return
      }

      const message = submitError instanceof Error ? submitError.message : 'Kirishda xatolik.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10 p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <div className="bg-primary p-8 text-white">
            <div className="text-sm uppercase tracking-[0.2em] text-white/70">Edu_AI</div>
            <h2 className="mt-4 text-4xl font-bold">Xush kelibsiz</h2>
            <p className="mt-4 text-white/80">Talabalar, mentorlar va adminlar uchun shaxsiy ta'lim platformasi.</p>
            <div className="mt-8 space-y-3">
              {(['student', 'mentor', 'admin'] as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left ${selectedRole === role ? 'bg-white/10' : 'bg-white/5'}`}
                >
                  <span className="capitalize">{t(role, 'uz')}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="p-8">
            <h3 className="text-2xl font-bold">{selectedRole === 'student' ? 'Talaba' : selectedRole === 'mentor' ? 'Mentor' : 'Admin'} ga kirish</h3>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium">Login</label>
                <input id="username" className="w-full rounded-xl border px-3 py-2" placeholder="Username" {...register('username')} />
                {errors.username && <p className="mt-1 text-sm text-red-600">Ushbu maydon to'ldirilishi kerak</p>}
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">Parol</label>
                <input id="password" type="password" className="w-full rounded-xl border px-3 py-2" placeholder="••••••••" {...register('password')} />
                {errors.password && <p className="mt-1 text-sm text-red-600">Parol minimum 6 ta belgidan iborat bo'lishi kerak</p>}
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button disabled={submitting} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60">
                {submitting ? 'Kirish...' : 'Kirish'}
              </button>
            </form>

            <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer font-medium">Demo hisoblar</summary>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {demoUsers.map((user) => (
                  <div key={user.username} className="flex justify-between gap-4 rounded-xl bg-white p-2">
                    <span>{user.name} / {user.role}</span>
                    <span className="font-mono">{user.username}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardFrame() {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />

  const navItems = [
    { to: `/${user.role}`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/${user.role}/courses`, label: 'Kurslar', icon: BookOpen },
    { to: `/${user.role}/settings`, label: 'Sozlamalar', icon: Settings },
  ]

  if (user.role === 'mentor') {
    navItems.push({ to: '/mentor/students', label: 'Talabalar', icon: Users })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
        <div className="flex items-center gap-2 text-xl font-bold text-primary"><Crown className="h-6 w-6" /> Edu_AI</div>
        <nav className="mt-8 space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 ${isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium"
          onClick={() => {
            useAuthStore.getState().logout()
            window.location.assign('/')
          }}
        >
          <LogOut className="h-4 w-4" /> Chiqish
        </button>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{user.role}</div>
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="Qidirish" className="rounded-xl border p-2 text-slate-600"><Search className="h-4 w-4" /></button>
            <button aria-label="Xabarlar" className="rounded-xl border p-2 text-slate-600"><MessageSquareText className="h-4 w-4" /></button>
          </div>
        </header>
        <main className="p-6"><Outlet /></main>
      </div>
    </div>
  )
}

function RequireRole({ role, children }: { role: Role; children: ReactElement }) {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return children
}

function StudentDashboard() {
  const user = useAuthStore((state) => state.user)
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Salom, {user?.name ?? 'Aziza'} 👋</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'O\'rganish darajasi', value: '89%' },
          { label: 'Dars seriyasi', value: '12 kun' },
          { label: 'XP', value: '240' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="mt-3 text-3xl font-bold text-primary">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Faol kurslar</h2>
          <div className="mt-4 space-y-4">
            {courses.slice(0, 3).map((course) => (
              <div key={course.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex justify-between"><span>{course.title}</span><span>{course.progress}%</span></div>
                <div className="mt-2 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-primary" style={{ width: `${course.progress}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">AI tavsiyasi</h2>
          <div className="mt-4 rounded-xl bg-primary/5 p-4 text-sm text-slate-700">
            Bugungi mashg'ulot: React state management va mini-laboratoriya bo'yicha 30 daqiqa ishlang.
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentCoursesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Kurslar</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">{course.category}</div>
            <h3 className="text-xl font-bold">{course.title}</h3>
            <p className="mt-2 text-slate-600">O'qituvchi: {course.teacher}</p>
            <div className="mt-4 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>{course.progress}% yakunlangan</span>
              <span>{course.lessons} dars</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentSettingsPage() {
  const user = useAuthStore((state) => state.user)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-bold">Sozlamalar</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Profil</div>
          <div className="mt-2 font-semibold">{user?.name}</div>
          <div className="text-slate-600">{user?.email}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Til</div>
          <div className="mt-2 font-semibold">O'zbekcha</div>
        </div>
      </div>
    </div>
  )
}

function MentorDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Mentor paneli</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {['Jami talabalar', 'O\'rtacha mastery', 'Tekshirilmagan vazifalar', 'Reyting'].map((item, index) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{item}</div>
            <div className="mt-3 text-3xl font-bold text-secondary">{[128, 84, 17, 4.9][index]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MentorStudentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Talabalar</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {['Aziza Karimova', 'Samandar', 'Dilnoza'].map((name) => (
          <div key={name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{name}</div>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Faol</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-200">
              <div className="h-2 w-4/5 rounded-full bg-primary" />
            </div>
            <div className="mt-3 text-sm text-slate-500">AI insight: tezkor rivojlanish tendentsiyasi yuqori.</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Admin paneli</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {['Uptime', 'Latency', 'Error rate', 'AI load'].map((item, index) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{item}</div>
            <div className="mt-3 text-3xl font-bold text-tertiary">{[99.9, 180, 0.4, 62][index]}{index === 2 || index === 3 ? '%' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminSettingsPage() {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Admin sozlamalar</div>
}

function NotFoundPage() {
  return <div className="p-10 text-center"><h1 className="text-3xl font-bold">404</h1><p>Sahifa topilmadi.</p><Link to="/" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-white">Bosh sahifaga qaytish</Link></div>
}

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/student',
    element: <DashboardFrame />,
    children: [
      { index: true, element: <RequireRole role="student" children={<StudentDashboard />} /> },
      { path: 'courses', element: <RequireRole role="student" children={<StudentCoursesPage />} /> },
      { path: 'settings', element: <RequireRole role="student" children={<StudentSettingsPage />} /> },
    ],
  },
  {
    path: '/mentor',
    element: <DashboardFrame />,
    children: [
      { index: true, element: <RequireRole role="mentor" children={<MentorDashboard />} /> },
      { path: 'courses', element: <RequireRole role="mentor" children={<StudentCoursesPage />} /> },
      { path: 'students', element: <RequireRole role="mentor" children={<MentorStudentsPage />} /> },
      { path: 'settings', element: <RequireRole role="mentor" children={<StudentSettingsPage />} /> },
    ],
  },
  {
    path: '/admin',
    element: <DashboardFrame />,
    children: [
      { index: true, element: <RequireRole role="admin" children={<AdminDashboard />} /> },
      { path: 'settings', element: <RequireRole role="admin" children={<AdminSettingsPage />} /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
