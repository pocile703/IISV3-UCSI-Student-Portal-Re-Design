export type PostType = 'announcement' | 'urgent' | 'reminder' | 'update'

export interface ClassPost {
  id: string
  courseSectionId: string | null
  authorId: string
  title: string
  body: string
  type: PostType
  isPinned: boolean
  isPublished: boolean
  createdAt: string
}
