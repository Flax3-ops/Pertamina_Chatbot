import React, { useState, useEffect, useCallback } from 'react'
import MessageList from '../components/chat/MessageList'
import ChatInput from '../components/chat/ChatInput'
import { chatService, getErrorMessage } from '../services/api'
import './ChatPage.css'

/**
 * Normalises the raw message array returned by the backend
 * into the shape our ChatMessage component expects:
 *   { role: 'human' | 'ai', content: string, tool_calls: [] }
 */
function normaliseMessages(raw = []) {
  return raw.map(msg => {
    const role = msg.role ?? (msg.type === 'human' ? 'human' : 'ai')
    const content = msg.content ?? ''
    const tool_calls = (msg.tool_calls ?? []).map(tc => ({
      name: tc.name ?? tc.tool ?? '',
      input: tc.args ?? tc.input ?? {},
      output: tc.output ?? null,
      status: tc.status ?? (tc.output != null ? 'done' : 'running'),
    }))
    return { role, content, tool_calls }
  })
}

export default function ChatPage({ activeThreadId, onThreadChange }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load messages when thread changes
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    chatService.getMessages(activeThreadId)
      .then(data => setMessages(normaliseMessages(data.messages ?? [])))
      .catch((err) => {
        setMessages([])
        setError(getErrorMessage(err, 'Gagal memuat pesan percakapan.'))
      })
      .finally(() => setLoading(false))
  }, [activeThreadId])

  const sendMessage = useCallback(async (text) => {
    if (!text || !text.trim() || loading) return
    setError(null)

    // Optimistic UI: add human message immediately
    const humanMsg = { role: 'human', content: text, tool_calls: [] }
    setMessages(prev => [...prev, humanMsg])
    setLoading(true)

    try {
      const data = await chatService.sendMessage(activeThreadId ?? null, text)

      // Notify parent if a new thread was created
      if (data.thread_id && data.thread_id !== activeThreadId) {
        onThreadChange(data.thread_id)
      }

      setMessages(normaliseMessages(data.messages ?? []))
    } catch (err) {
      let errMsg = getErrorMessage(err, 'Terjadi kesalahan.')
      if (err.code === 'ECONNABORTED' || errMsg.includes('timeout')) {
        errMsg = 'Permintaan membutuhkan waktu lebih lama dari batas waktu (timeout). Server sedang memproses tugas berat atau LLM sedang sibuk. Silakan coba kembali.'
      }
      setError(errMsg)
      // Remove optimistic human message on failure
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }, [activeThreadId, loading, onThreadChange])

  return (
    <div className="chat-page">
      {error && (
        <div className="chat-error-banner">
          ⚠️ {error}
        </div>
      )}
      <MessageList
        messages={messages}
        loading={loading}
        onSelectSuggestion={sendMessage}
      />
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  )
}
