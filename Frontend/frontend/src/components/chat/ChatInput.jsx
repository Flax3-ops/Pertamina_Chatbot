import React, { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import './ChatInput.css'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  // Focus textarea when component mounts and when disabled becomes false
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled])

  // Auto-resize textarea height
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }, [value])

  const handleSend = () => {
    const msg = value.trim()
    if (!msg || disabled) return
    onSend(msg)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-input-wrapper">
      <div className={`chat-input-box ${disabled ? 'disabled' : ''}`}>
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pesan Anda… (Enter untuk kirim, Shift+Enter untuk baris baru)"
          disabled={disabled}
          rows={1}
        />
        <button
          className={`send-btn ${value.trim() && !disabled ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          title="Kirim pesan"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="chat-input-hint">
        Asisten AI dapat membuat kesalahan. Verifikasi informasi penting dengan dokumen resmi.
      </p>
    </div>
  )
}
