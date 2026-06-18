// Learning resource types

export type ResourceType = 'slide' | 'tutorial' | 'exercise' | 'assignment' | 'recording' | 'other'

export interface LearningResource {
  id: string
  courseSectionId: string
  uploadedBy: string
  title: string
  description?: string
  type: ResourceType
  isPublished: boolean
  createdAt: string
  updatedAt: string
  attachments?: ResourceAttachment[]
}

export interface ResourceAttachment {
  id: string
  resourceId: string
  originalFilename: string
  mimeType: string
  fileSizeBytes: number
  downloadCount: number
}
