import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { fetchFeed, createPost, deletePost } from '@/api/feed'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useFeedStore } from '@/stores/feedStore'
import type { Post } from '@/types'

function PostCard({
  post,
  canModerate,
  onDelete,
}: {
  post: Post
  canModerate: boolean
  onDelete: (id: string) => void
}) {
  const initials = `${post.author.firstName[0]}${post.author.lastName[0]}`
  return (
    <Card className="overflow-hidden border-border/80">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            {post.author.avatarUrl && <AvatarImage src={post.author.avatarUrl} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {post.author.firstName} {post.author.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.createdAt).toLocaleString('ru-RU')}
                </p>
              </div>
              {canModerate && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(post.id)}>
                  Удалить
                </Button>
              )}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>
            {post.mediaUrl && post.mediaType === 'image' && (
              <img src={post.mediaUrl} alt="" className="mt-3 max-h-80 w-full rounded-xl object-cover" />
            )}
            {post.mediaUrl && post.mediaType === 'video' && (
              <video src={post.mediaUrl} controls className="mt-3 max-h-80 w-full rounded-xl" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FeedPage() {
  const user = useAuthStore((s) => s.user)
  const posts = useFeedStore((s) => s.posts)
  const nextCursor = useFeedStore((s) => s.nextCursor)
  const setPosts = useFeedStore((s) => s.setPosts)
  const appendPosts = useFeedStore((s) => s.appendPosts)
  const prependPost = useFeedStore((s) => s.prependPost)
  const removePost = useFeedStore((s) => s.removePost)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const canPost = user?.role === 'trainer' || user?.role === 'admin'

  const load = useCallback(
    async (cursor?: string) => {
      const data = await fetchFeed(cursor)
      if (cursor) appendPosts(data.posts, data.nextCursor)
      else setPosts(data.posts, data.nextCursor)
    },
    [appendPosts, setPosts],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        await load()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !nextCursor) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void load(nextCursor)
        }
      },
      { rootMargin: '200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [load, nextCursor])

  async function onRefresh() {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  async function onCreate() {
    if (!content.trim()) return
    const post = await createPost(content.trim())
    prependPost(post)
    setContent('')
    setOpen(false)
  }

  async function onDelete(id: string) {
    await deletePost(id)
    removePost(id)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Лента"
        right={
          canPost ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="secondary" className="rounded-full">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый пост</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Текст поста"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <Button className="w-full" onClick={() => void onCreate()}>
                    Опубликовать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        onTouchStart={(e) => {
          const startY = e.touches[0].clientY
          const onMove = (ev: TouchEvent) => {
            if (ev.touches[0].clientY - startY > 80) {
              void onRefresh()
              window.removeEventListener('touchmove', onMove)
            }
          }
          window.addEventListener('touchmove', onMove, { passive: true })
        }}
      >
        {refreshing && <p className="mb-2 text-center text-xs text-muted-foreground">Обновление…</p>}
        {loading && <p className="text-center text-sm text-muted-foreground">Загрузка…</p>}
        <div className="space-y-3">
          {posts.map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <PostCard
                post={p}
                canModerate={user?.role === 'admin' || p.authorId === user?.id}
                onDelete={onDelete}
              />
            </motion.div>
          ))}
        </div>
        <div ref={sentinelRef} className="h-4" />
      </div>
    </div>
  )
}
