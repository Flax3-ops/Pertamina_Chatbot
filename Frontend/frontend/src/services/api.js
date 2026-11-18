import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 180000,
})

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

  downloadUrl: (filename) => `/api/tender/download/${encodeURIComponent(filename)}`,
}

// ── RKS ──────────────────────────────────────────────────────────────────────

export const rksService = {
  generate: (payload) =>
    api.post('/rks/generate', payload).then(r => r.data),

  list: () =>
    api.get('/rks/generated').then(r => r.data),

  downloadDocxUrl: (artifactId) => `/api/rks/${encodeURIComponent(artifactId)}/document.docx`,
  downloadPdfUrl: (artifactId) => `/api/rks/${encodeURIComponent(artifactId)}/preview.pdf`,
  downloadUrl: (artifactId) => `/api/rks/${encodeURIComponent(artifactId)}/document.docx`,
}

// ── Google Drive & Knowledge Base ─────────────────────────────────────────────

export const gdriveService = {
  getStatus: () => api.get('/gdrive/status').then(r => r.data),
  saveConfig: (payload) => api.post('/gdrive/config', payload).then(r => r.data),
  sync: (payload = {}) => api.post('/gdrive/sync', payload).then(r => r.data),
  getFiles: () => api.get('/gdrive/files').then(r => r.data),
  disconnect: () => api.post('/gdrive/disconnect').then(r => r.data),
}

// ── Health ───────────────────────────────────────────────────────────────────

export const healthCheck = () =>
  api.get('/health').then(r => r.data)

export default api
