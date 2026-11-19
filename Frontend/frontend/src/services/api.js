import axios from 'axios'

// Origin backend FastAPI. Kosong = same-origin (dev lokal memakai proxy Vite).
// Produksi (Vercel): set VITE_API_URL, mis. https://api.domainanda.com
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')

/**
 * Tambahkan origin backend ke path relatif `/api/...`.
 * URL absolut (http/https) dikembalikan apa adanya.
 * @param {string} path
 */
export const apiUrl = (path) =>
  typeof path === 'string' && path.startsWith('/api') ? `${API_ORIGIN}${path}` : path

const api = axios.create({
  baseURL: apiUrl('/api'),
  timeout: 180000,
})

/**
 * Ubah error axios/FastAPI menjadi string yang aman dirender React.
 * FastAPI mengirim `detail` sebagai string (HTTPException) atau array objek
 * `{loc, msg, type}` (error validasi 422).
 * @param {unknown} err
 * @param {string} fallback
 * @returns {string}
 */
export function getErrorMessage(err, fallback = 'Terjadi kesalahan.') {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map(d => {
        if (typeof d === 'string') return d
        const field = Array.isArray(d?.loc) ? d.loc.filter(p => p !== 'body').join('.') : ''
        const msg = d?.msg ?? JSON.stringify(d)
        return field ? `${field}: ${msg}` : msg
      })
      .join('; ')
  }
  if (detail && typeof detail === 'object') return detail.msg ?? JSON.stringify(detail)
  return err?.message || fallback
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export const chatService = {
  /**
   * Kirim pesan ke agent dan dapatkan respons lengkap (non-streaming).
   * @param {string|null} threadId
   * @param {string} message
   * @returns {Promise<{messages: Array, thread_id: string}>}
   */
  sendMessage: (threadId, message) =>
    api.post('/chat', { thread_id: threadId, message }).then(r => r.data),

  /**
   * Ambil semua thread percakapan dari database.
   */
  listThreads: () =>
    api.get('/chat/threads').then(r => r.data),

  /**
   * Buat thread percakapan baru.
   * @param {string} title
   */
  createThread: (title) =>
    api.post('/chat/threads', { title }).then(r => r.data),

  /**
   * Ambil riwayat pesan dari satu thread.
   * @param {string} threadId
   */
  getMessages: (threadId) =>
    api.get(`/chat/threads/${threadId}/messages`).then(r => r.data),

  /**
   * Hapus thread percakapan.
   * @param {string} threadId
   */
  deleteThread: (threadId) =>
    api.delete(`/chat/threads/${threadId}`).then(r => r.data),

  /**
   * Rename thread percakapan.
   */
  renameThread: (threadId, title) =>
    api.patch(`/chat/threads/${threadId}`, { title }).then(r => r.data),
}

// ── Tender ───────────────────────────────────────────────────────────────────

export const tenderService = {
  extractContext: (formData) =>
    api.post('/tender/extract-context', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  generate: (payload) =>
    api.post('/tender/generate', payload).then(r => r.data),

  downloadUrl: (filename) => apiUrl(`/api/tender/download/${encodeURIComponent(filename)}`),
}

// ── RKS ──────────────────────────────────────────────────────────────────────

export const rksService = {
  generate: (payload) =>
    api.post('/rks/generate', payload).then(r => r.data),

  list: () =>
    api.get('/rks/generated').then(r => r.data),

  downloadDocxUrl: (artifactId) => apiUrl(`/api/rks/${encodeURIComponent(artifactId)}/document.docx`),
  downloadPdfUrl: (artifactId) => apiUrl(`/api/rks/${encodeURIComponent(artifactId)}/preview.pdf`),
  downloadUrl: (artifactId) => apiUrl(`/api/rks/${encodeURIComponent(artifactId)}/document.docx`),
}

// ── Google Drive & Knowledge Base ─────────────────────────────────────────────

export const gdriveService = {
  getStatus: () => api.get('/gdrive/status').then(r => r.data),
  saveConfig: (payload) => api.post('/gdrive/config', payload).then(r => r.data),
  sync: (payload = {}) => api.post('/gdrive/sync', payload).then(r => r.data),
  getFiles: () => api.get('/gdrive/files').then(r => r.data),
  disconnect: () => api.post('/gdrive/disconnect').then(r => r.data),
}

// ── Amandemen Kontrak ─────────────────────────────────────────────────────────

export const amendmentService = {
  listContracts: () => api.get('/amendment/contracts').then(r => r.data),
  getContractContext: (contractId) => api.get(`/amendment/contract-context/${encodeURIComponent(contractId)}`).then(r => r.data),
  generate: (payload) => api.post('/amendment/generate', payload).then(r => r.data),
  downloadUrl: (filename) => apiUrl(`/api/amendment/download/${encodeURIComponent(filename)}`),
  listHistory: () => api.get('/amendment/list').then(r => r.data),
}

// ── Health ───────────────────────────────────────────────────────────────────

export const healthCheck = () =>
  api.get('/health').then(r => r.data)

export default api
