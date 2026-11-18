import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/sidebar/Sidebar'
import ChatPage from './pages/ChatPage'
import TenderPage from './pages/TenderPage'
import RKSPage from './pages/RKSPage'
import AmandemenPage from './pages/AmandemenPage'
import { chatService } from './services/api'
import './App.css'

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export default function App() {
  const [threads, setThreads] = useState([])
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [threadsError, setThreadsError] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Load threads from backend
  const loadThreads = useCallback(async () => {
    setThreadsLoading(true)
    setThreadsError(null)
    try {
      const data = await chatService.listThreads()
      setThreads(data.threads ?? [])
    } catch (err) {
      setThreadsError('Gagal memuat riwayat percakapan')
      setThreads([])
    } finally {
      setThreadsLoading(false)
    }
  }, [])

  useEffect(() => { loadThreads() }, [loadThreads])

  const handleNewChat = useCallback(async () => {
    setActiveThreadId(null)
  }, [])

  const handleSelectThread = useCallback((id) => {
    setActiveThreadId(id)
  }, [])

  const handleDeleteThread = useCallback(async (id) => {
    try {
      await chatService.deleteThread(id)
      setThreads(prev => prev.filter(t => t.id !== id))
      if (activeThreadId === id) setActiveThreadId(null)
    } catch {}
  }, [activeThreadId])

  const handleRenameThread = useCallback(async (id, title) => {
    try {
      await chatService.renameThread(id, title)
      setThreads(prev => prev.map(t => t.id === id ? { ...t, title } : t))
    } catch {}
  }, [])

  // Called by ChatPage when backend creates a new thread
  const handleThreadChange = useCallback((newId) => {
    setActiveThreadId(newId)
    loadThreads() // refresh the sidebar
  }, [loadThreads])

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChat={handleNewChat}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
          onRenameThread={handleRenameThread}
          loading={threadsLoading}
          error={threadsError}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        />

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <ChatPage
                  activeThreadId={activeThreadId}
                  onThreadChange={handleThreadChange}
                />
              }
            />
            <Route path="/generate-tender" element={<TenderPage />} />
            <Route path="/generate-rks" element={<RKSPage />} />
            <Route path="/generate-amandemen" element={<AmandemenPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
