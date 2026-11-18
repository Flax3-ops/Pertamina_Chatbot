import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MessageList from '../components/chat/MessageList'
import ChatInput from '../components/chat/ChatInput'
import { chatService } from '../services/api'
import { v4 as uuidv4 } from 'uuid'
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
    // Tool calls embedded inside AI messages
    const tool_calls = (msg.tool_calls ?? []).map(tc => ({
      name: tc.name ?? tc.tool ?? '',
      input: tc.args ?? tc.input ?? {},
      output: tc.output ?? null,
      status: tc.output != null ? 'done' : 'running',
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
      return
    }
    setLoading(true)
    chatService.getMessages(activeThreadId)
      .then(data => setMessages(normaliseMessages(data.messages ?? [])))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [activeThreadId])

  const sendMessage = useCallback(async (text) => {
    setError(null)

    // Optimistic UI: add human message immediately
    const humanMsg = { role: 'human', content: text, tool_calls: [] }
    setMessages(prev => [...prev, humanMsg])
    setLoading(true)

    try {
      // If no active thread, the backend will create one
      const data = await chatService.sendMessage(activeThreadId ?? null, text)

      // Backend returns new thread_id if one was created
      if (data.thread_id && data.thread_id !== activeThreadId) {
        onThreadChange(data.thread_id)
      }

      setMessages(normaliseMessages(data.messages ?? []))
    } catch (err) {
      setError(err?.response?.data?.detail ?? err.message ?? 'Terjadi kesalahan.')
      // Remove optimistic human message on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }, [activeThreadId, onThreadChange])

  return (
    <div className="chat-page">
      {error && (
        <div className="chat-error-banner">
          ⚠️ {error}
        </div>
      )}
      <MessageList messages={messages} loading={loading} />
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  )
}
