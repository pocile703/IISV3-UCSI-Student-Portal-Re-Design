// User and session types shared across client and server

export type Role = 'student' | 'lecturer' | 'admin'

export interface User {
  id: string
  username: string
  emailInstitutional: string
  emailPersonal?: string
  role: Role
  isActive: boolean
}

export interface SessionUser {
  id: string
  role: Role
  studentId?: string
  lecturerId?: string
  sessionVersion: number
}
