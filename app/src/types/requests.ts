// View-model types for the Add/Drop + Progression request surfaces
// (student /requests and admin /admin/requests). Narrowed to what the pages
// render — enum values are lowercased to match the frontend unions.

export type RequestStatus = 'pending' | 'approved' | 'rejected'
export type AddDropAction = 'add' | 'drop'

export interface AddDropRequestRow {
  id: string
  action: AddDropAction
  status: RequestStatus
  sectionLabel: string // "DIT1234 Intro to X · Sec A"
  reason: string | null
  createdAt: string // ISO
  reviewedAt: string | null // ISO
}

export interface ProgressionRequestRow {
  id: string
  status: RequestStatus
  fromSemester: string
  toSemester: string
  reason: string
  createdAt: string // ISO
  reviewedAt: string | null // ISO
}

export interface SectionOption {
  id: string
  label: string
}

export interface SemesterOption {
  id: string
  name: string
}

export interface StudentRequestsData {
  requests: {
    addDrop: AddDropRequestRow[]
    progression: ProgressionRequestRow[]
  }
  options: {
    currentSemesterId: string | null
    currentSemesterName: string | null
    addableSections: SectionOption[]
    droppableSections: SectionOption[]
    progressionTargets: SemesterOption[]
  }
}

// Admin rows carry the requesting student's identity for the moderation queue.
export interface AdminAddDropRow extends AddDropRequestRow {
  studentName: string
  studentNumber: string
}

export interface AdminProgressionRow extends ProgressionRequestRow {
  studentName: string
  studentNumber: string
}

export interface AdminRequestsData {
  addDrop: AdminAddDropRow[]
  progression: AdminProgressionRow[]
}
