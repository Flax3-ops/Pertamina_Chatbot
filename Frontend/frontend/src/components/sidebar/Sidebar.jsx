import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  MessageSquare,
  FileText,
  ClipboardList,
  FilePen,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Pencil,
} from 'lucide-react'
import './Sidebar.css'

const NAV_ITEMS = [
  { path: '/generate-rks', label: 'Generate RKS', icon: FileText },
  { path: '/generate-tender', label: 'Generate Tender', icon: ClipboardList },
  { path: '/generate-amandemen', label: 'Generate Amandemen', icon: FilePen },
]

export default function Sidebar({
  threads,
  activeThreadId,
  onNewChat,
  onSelectThread,
  onDeleteThread,
  onRenameThread,
  loading,
  error,
  collapsed,
  onToggleCollapse,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const startRename = (thread, e) => {
    e.stopPropagation()
    setRenamingId(thread.id)
    setRenameValue(thread.title)
  }

  const submitRename = (id) => {
    if (renameValue.trim()) onRenameThread(id, renameValue.trim())
    setRenamingId(null)
  }

  const isChat = location.pathname === '/' || location.pathname === '/chat'

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand">
            <span className="brand-logo">⚡</span>
            <span className="brand-name">Pertamina AI</span>
          </div>
        )}
        <button className="collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* New Chat */}
      <button className={`new-chat-btn ${collapsed ? 'icon-only' : ''}`} onClick={onNewChat}>
        <Plus size={16} />
        {!collapsed && <span>Percakapan Baru</span>}
      </button>

      {/* Navigation */}
      <div className="sidebar-section">
        {!collapsed && <div className="section-label">Menu</div>}
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''} ${collapsed ? 'icon-only' : ''}`}
            onClick={() => navigate(path)}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </div>

      {/* Chat History */}
      {!collapsed && (
        <div className="sidebar-section threads-section">
          <div className="section-label">Riwayat Percakapan</div>

          {error && (
            <div className="sidebar-error">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          {loading && !threads.length && (
            <div className="sidebar-loading">
              <Loader2 size={14} className="spin" />
              <span>Memuat…</span>
            </div>
          )}

          <div className="thread-list">
            {threads.map(thread => (
              <div
                key={thread.id}
                className={`thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
                onClick={() => { onSelectThread(thread.id); navigate('/') }}
              >
                <MessageSquare size={13} className="thread-icon" />
                {renamingId === thread.id ? (
                  <input
                    className="rename-input"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => submitRename(thread.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitRename(thread.id)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="thread-title">{thread.title}</span>
                )}
                <div className="thread-actions">
                  <button
                    className="thread-action-btn"
                    onClick={e => startRename(thread, e)}
                    title="Rename"
                  ><Pencil size={11} /></button>
                  <button
                    className="thread-action-btn danger"
                    onClick={e => { e.stopPropagation(); onDeleteThread(thread.id) }}
                    title="Hapus"
                  ><Trash2 size={11} /></button>
                </div>
              </div>
            ))}

            {!loading && threads.length === 0 && !error && (
              <div className="thread-empty">Belum ada percakapan</div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
