import { api } from '@/api/client'

export async function uploadFile(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<{ url: string; mediaType: string }>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
