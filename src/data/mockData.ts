export type Role = 'student' | 'mentor' | 'admin'

export interface UserProfile {
  id: string
  name: string
  username: string
  role: Role
  email: string
}

export interface Course {
  id: string
  title: string
  category: string
  teacher: string
  progress: number
  status: 'Faol' | 'Tugatilgan' | 'Arxivlangan'
  lessons: number
}

export interface Assignment {
  id: string
  title: string
  student: string
  score: number
  status: 'pending' | 'graded'
}

export const demoUsers: UserProfile[] = [
  { id: 'u-student', name: 'Aziza Karimova', username: 'aziza', role: 'student', email: 'aziza@edu-ai.uz' },
  { id: 'u-mentor', name: 'Alisher Sultonov', username: 'alisher', role: 'mentor', email: 'alisher@edu-ai.uz' },
  { id: 'u-admin', name: 'Admin', username: 'admin', role: 'admin', email: 'admin@edu-ai.uz' },
]

export const courses: Course[] = [
  { id: 'c1', title: 'React va Frontend', category: 'Dasturlash', teacher: 'Nodira', progress: 72, status: 'Faol', lessons: 12 },
  { id: 'c2', title: 'UX/UI dizayn', category: 'Dizayn', teacher: 'Jasur', progress: 58, status: 'Faol', lessons: 10 },
  { id: 'c3', title: 'Marketing analitika', category: 'Marketing', teacher: 'Nilufar', progress: 40, status: 'Faol', lessons: 9 },
  { id: 'c4', title: 'Business basics', category: 'Biznes', teacher: 'Dilshod', progress: 100, status: 'Tugatilgan', lessons: 8 },
]

export const assignments: Assignment[] = [
  { id: 'a1', title: 'React state management', student: 'Aziza Karimova', score: 92, status: 'graded' },
  { id: 'a2', title: 'Landing page audit', student: 'Samandar', score: 81, status: 'graded' },
  { id: 'a3', title: 'Market research brief', student: 'Dilnoza', score: 0, status: 'pending' },
]
