import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { AdminPostsTable } from '@/components/admin/AdminPostsTable'
import { getAdminPostsData } from '@/services/posts-queries'

export default async function AdminPostsPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/login')

  const posts = await getAdminPostsData()

  const total       = posts.length
  const published   = posts.filter((p) => p.isPublished).length
  const drafts      = total - published
  const pinned      = posts.filter((p) => p.isPinned).length
  const globalCount = posts.filter((p) => p.courseSectionId === null).length

  const snapshotKey = `posts:${posts
    .map((p) => `${p.id}:${p.isPublished ? 1 : 0}:${p.isPinned ? 1 : 0}`)
    .join('|')}`

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">Post Moderation</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">Administrator</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Total Posts</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Published</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Drafts</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{drafts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Pinned</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{pinned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Global</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{globalCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts table */}
      <AdminPostsTable key={snapshotKey} initialPosts={posts} />

    </div>
  )
}
