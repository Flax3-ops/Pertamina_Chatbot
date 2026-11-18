import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/sidebar/Sidebar'
import ChatPage from './pages/ChatPage'
import TenderPage from './pages/TenderPage'
import RKSPage from './pages/RKSPage'
import AmandemenPage from './pages/AmandemenPage'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import { chatService } from './services/api'
import './App.css'

export default function App() {
  const [threads, setThreads] = useState([])
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [chatKey, setChatKey] = useState(0)
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

  // Trigger fresh new chat session
  const handleNewChat = useCallback(() => {
    setActiveThreadId(null)
    setChatKey(prev => prev + 1)
  }, [])

  const handleSelectThread = useCallback((id) => {
    setActiveThreadId(id)
  }, [])

  const handleDeleteThread = useCallback(async (id) => {
    try {
      await chatService.deleteThread(id)
      setThreads(prev => prev.filter(t => t.id !== id))
      if (activeThreadId === id) {
        setActiveThreadId(null)
        setChatKey(prev => prev + 1)
      }
    } catch {}
  }, [activeThreadId])

  const handleRenameThread = useCallback(async (id, title) => {
    try {
      await chatService.renameThread(id, title)
      setThreads(prev => prev.map(t => t.id === id ? { ...t, title } : t))
    } catch {}
  }, [])

  // Called by ChatPage or other pages when backend creates a new thread
  const handleThreadChange = useCallback((newId) => {
    setActiveThreadId(newId)
    loadThreads() // refresh the sidebar list
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
                  key={`${activeThreadId || 'new'}-${chatKey}`}
                  activeThreadId={activeThreadId}
                  onThreadChange={handleThreadChange}
                />
              }
            />
            <Route path="/generate-tender" element={<TenderPage />} />
            <Route path="/generate-rks" element={<RKSPage />} />
            <Route
              path="/generate-amandemen"
              element={<AmandemenPage onSelectThread={handleSelectThread} />}
            />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
