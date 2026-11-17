import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import { findUserByUsername, users } from './data/users.js'
import aiRouter from './routes/ai.js'
import dataRouter from './routes/data.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 8787)
const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret'

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.use('/api', dataRouter)
app.use('/api/ai', aiRouter)

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username || !password) {
    res.status(400).json({ error: 'Username va parol kerak.' })
    return
  }

  const user = findUserByUsername(username)
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ error: 'Login yoki parol xato.' })
    return
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, {
    expiresIn: '8h',
  })

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      email: user.email,
    },
  })
})

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    res.status(401).json({ error: 'Autentifikatsiya zarur.' })
    return
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as { sub: string; role: string }
    const user = users.find((record) => record.id === payload.sub)
    if (!user) {
      res.status(401).json({ error: 'Foydalanuvchi topilmadi.' })
      return
    }

    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      email: user.email,
    })
  } catch {
    res.status(401).json({ error: 'Token yaroqsiz.' })
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
