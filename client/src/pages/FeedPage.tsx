import { useCallback, useEffect, useRef, useState } from 'react'
import { http } from '@/api/http'
import type { Post } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function PostCard({ post, onDelete }: { post: Post; onDelete: (id: string) => void }) {
  const me = useAuthStore((s) => s.user)
  const initials = `${post.author.firstName[0] ?? ''}${post.author.lastName[0] ?? ''}`
  const canDelete = me?.id === post.authorId || me?.role === 'admin'
  return (
    <article className="border-b border-white/[0.08] py-6 last:border-b-0 sm:py-8">
      <div className="mb-4 flex items-start gap-3 sm:gap-4">
        <Avatar className="h-11 w-11 shrink-0 border border-white/10 sm:h-12 sm:w-12">
          <AvatarImage src={post.author.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-zinc-800">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-[17px] font-semibold leading-tight">
            {post.author.firstName} {post.author.lastName}
          </p>
          <p className="text-[13px] text-muted">
            {new Date(post.createdAt).toLocaleString('ru-RU')}
          </p>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/95">{post.content}</p>
      {post.mediaUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08]">
          {post.mediaType === 'video' ? (
            <video src={post.mediaUrl} controls className="max-h-[min(70vh,480px)] w-full object-cover" />
          ) : (
            <img
              src={post.mediaUrl}
              alt=""
              className="max-h-[min(70vh,480px)] w-full object-cover"
            />
          )}
        </div>
      ) : null}
      {canDelete ? (
        <Button variant="ghost" size="sm" className="mt-4 text-red-400 hover:bg-red-500/10" onClick={() => onDelete(post.id)}>
          Удалить
        </Button>
      ) : null}
    </article>
  )
}

export function FeedPage() {
  const user = useAuthStore((s) => s.user)
  const canPost = user?.role === 'trainer' || user?.role === 'admin'
  const [posts, setPosts] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(
    async (reset: boolean) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ limit: '20' })
        const c = reset ? null : cursor
        if (!reset && c) params.set('cursor', c)
        const { data } = await http.get<{ posts: Post[]; nextCursor: string | null }>(
          `/api/feed?${params.toString()}`,
        )
        setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]))
        setCursor(data.nextCursor)
      } finally {
        setLoading(false)
      }
    },
    [cursor],
  )

  useEffect(() => {
    void load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && cursor && !loading) void load(false)
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [cursor, load, loading])

  async function onDelete(id: string) {
    await http.delete(`/api/feed/${id}`)
    setPosts((p) => p.filter((x) => x.id !== id))
  }

  return (
    <div className="mx-auto w-full max-w-3xl pb-4">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[22px] font-bold tracking-tight sm:text-2xl">Лента</h1>
        {canPost ? (
          <CreatePostDialog onCreated={(p) => setPosts((prev) => [p, ...prev])} />
        ) : null}
      </header>
      <div>
        {posts.map((p) => (
          <PostCard key={p.id} post={p} onDelete={onDelete} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-4" />
      {loading ? <p className="py-6 text-center text-sm text-muted">Загрузка…</p> : null}
    </div>
  )
}

function CreatePostDialog({ onCreated }: { onCreated: (p: Post) => void }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!content.trim()) return
    setLoading(true)
    try {
      const { data } = await http.post<{ post: Post }>('/api/feed', { content: content.trim() })
      onCreated(data.post)
      setContent('')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Создать пост
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый пост</DialogTitle>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Текст поста…"
        />
        <Button className="w-full" onClick={submit} disabled={loading}>
          Опубликовать
        </Button>
      </DialogContent>
    </Dialog>
  )
}
