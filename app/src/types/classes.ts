import type { PostType } from '@/types/post'
import type { ResourceType } from '@/types/resource'

export interface ClassesAttachment {
  id: string
  originalFilename: string
  fileSizeBytes: number
  downloadCount: number
}

export interface ClassesResource {
  id: string
  title: string
  description?: string
  type: ResourceType
  createdAt: string
  attachment?: ClassesAttachment
}

export interface ClassesPost {
  id: string
  title: string
  body: string
  type: PostType
  isPinned: boolean
  createdAt: string
  authorName: string
}

export interface ClassesSectionData {
  sectionId: string
  sectionCode: string
  room: string
  courseCode: string
  courseTitle: string
  lecturerName: string
  resources: ClassesResource[]
  posts: ClassesPost[]
}

export interface ClassesPageData {
  semesterName: string
  globalPosts: ClassesPost[]
  sections: ClassesSectionData[]
}
