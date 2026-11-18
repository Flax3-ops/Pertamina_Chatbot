import React, { useRef, useEffect } from 'react'
import ChatMessage, { TypingIndicator } from './ChatMessage'
import './MessageList.css'

export default function MessageList({ messages, loading, onSelectSuggestion }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (messages.length === 0 && !loading) {
    return (
      <div className="message-list empty-state">
        <div className="empty-icon">🤖</div>
        <h2 className="empty-title">Asisten Pengadaan Pertamina</h2>
        <p className="empty-subtitle">
          Tanyakan seputar regulasi, tender, RKS, amandemen kontrak, atau minta saya membuat dokumen resmi.
        </p>
        <div className="empty-suggestions">
          {[
            'Berapa lama masa sanggah tender konstruksi?',
            'Buatkan draf RKS untuk pengadaan jasa katering',
            'Jelaskan ketentuan TKDN dalam pedoman pengadaan',
            'Generate dokumen amandemen kontrak',
          ].map((s, i) => (
            <div
              key={i}
              className="suggestion-chip"
              onClick={() => onSelectSuggestion && onSelectSuggestion(s)}
              title="Klik untuk menanyakan langsung"
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} />
      ))}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
