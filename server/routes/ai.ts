import { randomUUID } from 'crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'

import { callGemini } from '../lib/gemini.js'

const router = Router()

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      text: z.string().min(1).max(2000),
    }),
  ),
  context: z
    .object({
      role: z.string().optional(),
      courseTitle: z.string().optional(),
      lessonTitle: z.string().optional(),
      level: z.string().optional(),
    })
    .optional(),
})

const assessSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  submission: z.string().max(4000).default(''),
})

const insightSchema = z.object({
  studentName: z.string().default('Talaba'),
  recentScores: z.array(z.number().min(0).max(100)).default([]),
  activity: z.number().min(0).max(100).default(0),
  missedDeadlines: z.number().min(0).max(50).default(0),
})

const roadmapSchema = z.object({
  goal: z.string().min(1).max(200),
  currentLevel: z.string().min(1).max(100),
  weeklyHours: z.number().min(1).max(40),
})

const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p so\'rov. Bir daqiqa ichida qayta urinib ko\'ring.' },
})

router.use(limiter)

router.post('/chat', async (req, res) => {
  const parsed = chatSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'So\'rov formati noto\'g\'ri.' })
    return
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: 'AI xizmati sozlanmagan' })
    return
  }

  const { messages, context } = parsed.data
  const prompt = messages
    .map((message) => `${message.role}: ${message.text}`)
    .join('\n')

  const system = `Siz Edu_AI AI o'qituvchisisiz. Foydalanuvchi uchun Uzbek tilida qisqa, aniq javob bering. Agar lozim bo'lsa, 1 ta savol bering. Agar xavfsizlik bo'yicha so'rov bo'lsa, rad eting. Kurs konteksi: ${context?.courseTitle ?? 'umumiy'} / ${context?.lessonTitle ?? 'umumiy'} / ${context?.level ?? 'boshlangich'}.`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  try {
    const answer = await callGemini(prompt, system)
    const chunks = answer.match(/.{1,36}/g) ?? [answer]

    chunks.forEach((chunk, index) => {
      setTimeout(() => {
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`)
        if (index === chunks.length - 1) {
          res.write('data: [DONE]\n\n')
          res.end()
        }
      }, index * 28)
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI javobini olishda xatolik yuz berdi.'
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})

router.post('/assess', async (req, res) => {
  const parsed = assessSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Vazifa ma\'lumotlari noto\'g\'ri.' })
    return
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: 'AI xizmati sozlanmagan' })
    return
  }

  const { title, description, submission } = parsed.data
  const prompt = `Vazifa: ${title}\nTavsif: ${description}\nYuborilgan matn: ${submission}`

  try {
    const answer = await callGemini(
      prompt,
      'Siz Edu_AI platformasi uchun vazifa baholovchisisiz. 0-100 diapazonida ball bering, level: yaxshi/o\'rta/zaif, qisqa xulosa yozing. JSON formatdagi natija kerak: score, level, summary, points[]',
    )
    const score = Math.min(100, Math.max(0, Number(answer.match(/\d{1,3}/)?.[0] ?? 82)))
    const level = score >= 75 ? 'yaxshi' : score >= 50 ? "o'rta" : 'zaif'

    res.json({
      score,
      level,
      summary: `Vazifa bo'yicha umumiy baho: ${score}/100. ${level} darajada bajarilgan.`,
      points: [
        { type: 'success', text: "Asosiy g'oya aniq tushuntirilgan." },
        { type: 'info', text: 'Keyingi safar misollar bilan yanada kuchaytirish mumkin.' },
      ],
      requestId: randomUUID(),
    })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Baholashda xatolik.',
    })
  }
})

router.post('/insight', async (req, res) => {
  const parsed = insightSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Insight ma\'lumotlari noto\'g\'ri.' })
    return
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: 'AI xizmati sozlanmagan' })
    return
  }

  const average = parsed.data.recentScores.length
    ? parsed.data.recentScores.reduce((sum, value) => sum + value, 0) / parsed.data.recentScores.length
    : 0
  const status = average >= 75 ? 'success' : average >= 55 ? 'warning' : 'info'

  res.json({
    status,
    title: status === 'success' ? 'Yukori natija' : status === 'warning' ? 'Yaxshilash imkoniyati bor' : 'Diqqat kerak',
    description:
      status === 'success'
        ? `${parsed.data.studentName} o'quv jarayoni yaxshi rivojlanmoqda.`
        : status === 'warning'
          ? `${parsed.data.studentName} statistikasi o'rtacha, namunalar bilan ishlash kerak.`
          : `${parsed.data.studentName} uchun yana qo'shimcha mashg'ulot kerak.`,
    recommendedAction: "Kundalik 30 daqiqalik mashg'ulot va 1 ta mini-tekshiruvdan o'tkazing.",
  })
})

router.post('/roadmap', async (req, res) => {
  const parsed = roadmapSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Yo\'l xaritasi ma\'lumotlari noto\'g\'ri.' })
    return
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: 'AI xizmati sozlanmagan' })
    return
  }

  const { goal, currentLevel, weeklyHours } = parsed.data
  const weeks = Math.max(3, Math.round((weeklyHours * 5) / 2))

  res.json({
    modules: [
      { title: 'Asosiy bilimlar', description: `Maqsad: ${goal}. Boshlang'ich daraja ${currentLevel}.`, lessonsCount: 6, estimatedWeeks: 2 },
      { title: 'Amaliy mashqlar', description: 'Kichik loyihalar orqali nazariyani mustahkamlash.', lessonsCount: 8, estimatedWeeks: 3 },
      { title: 'Portfolio', description: "Final ko'rsatkich va hisobotni tayyorlash.", lessonsCount: 4, estimatedWeeks: 2 },
    ],
    weeks,
  })
})

export default router
