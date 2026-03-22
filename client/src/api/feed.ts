import { api } from '@/api/client'
import type { Post } from '@/types'

export async function fetchFeed(cursor?: string, limit = 20) {
  const { data } = await api.get<{ posts: Post[]; nextCursor: string | null }>('/feed', {
    params: { cursor, limit },
  })
  return data
}

export async function createPost(content: string, mediaUrl?: string, mediaType?: string) {
  const { data } = await api.post<{ post: Post }>('/feed', { content, mediaUrl, mediaType })
  return data.post
}

export async function deletePost(postId: string) {
  await api.delete(`/feed/${postId}`)
}
