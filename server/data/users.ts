import bcrypt from 'bcryptjs'

export type UserRole = 'student' | 'mentor' | 'admin'

export interface UserRecord {
  id: string
  username: string
  passwordHash: string
  name: string
  role: UserRole
  email: string
}

export const users: UserRecord[] = [
  {
    id: 'u-student',
    username: 'aziza',
    passwordHash: bcrypt.hashSync('Student123!', 10),
    name: 'Aziza Karimova',
    role: 'student',
    email: 'aziza@edu-ai.uz',
  },
  {
    id: 'u-mentor',
    username: 'alisher',
    passwordHash: bcrypt.hashSync('Mentor123!', 10),
    name: 'Alisher Sultonov',
    role: 'mentor',
    email: 'alisher@edu-ai.uz',
  },
  {
    id: 'u-admin',
    username: 'admin',
    passwordHash: bcrypt.hashSync('Admin123!', 10),
    name: 'Admin',
    role: 'admin',
    email: 'admin@edu-ai.uz',
  },
]

export function findUserByUsername(username: string): UserRecord | undefined {
  return users.find((user) => user.username.toLowerCase() === username.toLowerCase())
}
