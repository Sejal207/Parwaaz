import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const api = axios.create({
  baseURL: `${baseURL}/api`,
});


export const uploadSession = (formData, onProgress) =>
  api.post('/sessions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  })

export const listSessions  = () => api.get('/sessions/')
export const getSession    = (id) => api.get(`/sessions/${id}`)
export const deleteSession = (id) => api.delete(`/sessions/${id}`)

export default api