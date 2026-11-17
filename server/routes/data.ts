import { Router } from 'express'

const router = Router()

router.get('/courses', (_req, res) => {
  res.json({
    courses: [
      { id: 'course-1', title: 'React va Frontend', level: 'Boshlangich', teacher: 'Nodira', progress: 72 },
      { id: 'course-2', title: 'UX/UI dizayn', level: 'O\'rta', teacher: 'Jasur', progress: 55 },
      { id: 'course-3', title: 'Marketing analitika', level: 'Boshlangich', teacher: 'Nilufar', progress: 41 },
    ],
  })
})

router.get('/students', (_req, res) => {
  res.json({
    students: [
      { id: 's1', name: 'Aziza Karimova', mastery: 87, status: 'Faol' },
      { id: 's2', name: 'Samandar', mastery: 70, status: 'Faol' },
      { id: 's3', name: 'Dilnoza', mastery: 52, status: 'Passiv' },
    ],
  })
})

router.get('/assignments', (_req, res) => {
  res.json({
    assignments: [
      { id: 'a1', student: 'Aziza', module: 'React', due: 'Bugun', score: 92 },
      { id: 'a2', student: 'Samandar', module: 'UX', due: 'Ertaga', score: 81 },
    ],
  })
})

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'edu-ai-server' })
})

export default router
