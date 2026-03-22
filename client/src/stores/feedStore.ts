import { create } from 'zustand'
import type { Post } from '@/types'

interface FeedState {
  posts: Post[]
  nextCursor: string | null
  setPosts: (posts: Post[], nextCursor: string | null) => void
  appendPosts: (posts: Post[], nextCursor: string | null) => void
  prependPost: (post: Post) => void
  removePost: (id: string) => void
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  nextCursor: null,
  setPosts: (posts, nextCursor) => set({ posts, nextCursor }),
  appendPosts: (posts, nextCursor) =>
    set((state) => ({
      posts: [...state.posts, ...posts],
      nextCursor,
    })),
  prependPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  removePost: (id) => set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),
}))
