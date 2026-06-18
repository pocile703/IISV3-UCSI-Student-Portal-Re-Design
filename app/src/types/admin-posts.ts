// View-model types for /admin/posts — scoped to what the page renders.
// PostsPageRow is passed to the admin posts table and moderation components.

export type PostsPageRow = {
  id: string
  title: string
  body: string                        // used for search only, not rendered as HTML
  type: 'announcement' | 'urgent' | 'reminder' | 'update'
  isPinned: boolean
  isPublished: boolean
  createdAt: string                   // ISO string
  courseSectionId: string | null      // null = global admin announcement
  sectionLabel: string                // e.g. "IT101 · Sec A" or "Global announcement"
  authorName: string                  // lecturer fullName or "Staff"
}
