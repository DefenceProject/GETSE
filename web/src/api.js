import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', r.data.token)
    setUser(r.data)
    return r.data
  }

  const register = async (username, email, password, role) => {
    const r = await api.post('/auth/register', { username, email, password, role })
    localStorage.setItem('token', r.data.token)
    setUser(r.data)
    return r.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return { user, loading, login, register, logout }
}

export const booksApi = {
  getAll: (params) => api.get('/books', { params }).then(r => r.data),
  getById: (id) => api.get(`/books/${id}`).then(r => r.data),
  create: (data) => api.post('/books', data).then(r => r.data),
  update: (id, data) => api.put(`/books/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/books/${id}`).then(r => r.data),
  search: (q, filters = {}) => api.get('/books', { params: { search: q, ...filters } }).then(r => r.data),
  download: (id) => api.get(`/books/${id}/download`, { responseType: 'blob' }).then(r => r.data),
}

export const purchasesApi = {
  getLibrary: () => api.get('/purchases/library').then(r => r.data),
  purchase: (book_id) => api.post('/purchases', { book_id }).then(r => r.data),
  getRevenue: () => api.get('/purchases/revenue').then(r => r.data),
  initiatePayment: (book_id, provider) => api.post('/payments/initiate', { book_id, provider }).then(r => r.data),
  confirmPayment: (transaction_ref) => api.post('/payments/confirm', { transaction_ref }).then(r => r.data),
}

export const adminApi = {
  getStats: () => api.get('/admin/stats').then(r => r.data),
  getUsers: () => api.get('/admin/users').then(r => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then(r => r.data),
  getBooks: () => api.get('/admin/books').then(r => r.data),
  deleteBook: (id) => api.delete(`/admin/books/${id}`).then(r => r.data),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(r => r.data),
}

export const notificationsApi = {
  getAll: () => api.get('/notifications').then(r => r.data),
  markRead: (id) => api.put(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.put('/notifications/read-all').then(r => r.data),
  broadcast: (title, message, type) => api.post('/notifications/broadcast', { title, message, type }).then(r => r.data),
}

export const recommendationsApi = {
  get: () => api.get('/recommendations').then(r => r.data),
}

export default api
