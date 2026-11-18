import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

// ── Chat ──────────────────────────────────────────────────────────────────────

export const chatService = {
  /**
   * Kirim pesan ke agent dan dapatkan respons lengkap (non-streaming).
   * @param {string} threadId
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

  downloadUrl: (filename) => `/api/tender/download/${filename}`,
}

// ── RKS ──────────────────────────────────────────────────────────────────────

export const rksService = {
  generate: (payload) =>
    api.post('/rks/generate', payload).then(r => r.data),

  list: () =>
    api.get('/rks/list').then(r => r.data),

  downloadUrl: (filename) => `/api/rks/download/${filename}`,
}

// ── Health ───────────────────────────────────────────────────────────────────

export const healthCheck = () =>
  api.get('/health').then(r => r.data)

export default api
