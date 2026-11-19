import React, { useState, useEffect, useCallback } from 'react'
import {
  Database,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Search,
  FileText,
  Clock,
  Layers,
  Unlink,
} from 'lucide-react'
import { gdriveService } from '../services/api'
import './FormPage.css'
import './KnowledgeBasePage.css'

export default function KnowledgeBasePage() {
  const [status, setStatus] = useState(null)
  const [filesData, setFilesData] = useState(null)
  const [folderInput, setFolderInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const [st, fl] = await Promise.all([
        gdriveService.getStatus(),
        gdriveService.getFiles(),
      ])
      setStatus(st)
      setFolderInput(st.folder_id || '')
      setFilesData(fl)
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Gagal memuat status Google Drive')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    if (!folderInput.trim()) return
    setSavingConfig(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await gdriveService.saveConfig({ folder_id: folderInput.trim() })
      setSuccessMsg(res.message || 'Folder ID berhasil disimpan.')
      setStatus(prev => ({ ...prev, folder_id: res.folder_id }))
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Gagal menyimpan konfigurasi folder.')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleRunSync = async () => {
    setSyncing(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    setSyncResult(null)
    try {
      const res = await gdriveService.sync({ folder_id: folderInput.trim() || undefined })
      setSyncResult(res)
      setSuccessMsg(res.message || 'Sinkronisasi berhasil!')
      // Refresh status and file list
      await loadData()
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Sinkronisasi gagal.')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Apakah Anda yakin ingin memutuskan integrasi akun Google Drive ini?')) return
    try {
      await gdriveService.disconnect()
      await loadData()
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Gagal memutuskan akun.')
    }
  }

  const activeDocuments = filesData?.active_documents || []
  const filteredDocs = activeDocuments.filter(doc =>
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.file_format?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const gdriveFolderUrl = status?.folder_id
    ? `https://drive.google.com/drive/folders/${status.folder_id}`
    : null

  return (
    <div className="form-page">
      {/* Header */}
      <div className="form-page-header">
        <div className="page-icon-wrap">
          <Database size={24} />
        </div>
        <div>
          <h1 className="form-page-title">Knowledge Base & Google Drive</h1>
          <p className="form-page-subtitle">
            Sinkronkan dokumen acuan RKS dan pengadaan dari Google Drive ke database vektor PostgreSQL
          </p>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="form-error">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          color: '#4ade80',
          fontSize: 13
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Account Status Card */}
      <div className="form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: '1.05em', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Status Koneksi Google Drive
            </h2>
            <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Autentikasi OAuth 2.0 dengan izin baca (read-only) untuk mengunduh dokumen acuan
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {status?.is_authenticated ? (
              <span className="kb-status-badge connected">
                <CheckCircle2 size={14} /> Terhubung: {status.email || 'Akun Google'}
              </span>
            ) : (
              <span className="kb-status-badge disconnected">
                <AlertCircle size={14} /> Belum Terhubung
              </span>
            )}

            {status?.is_authenticated && (
              <button
                className="action-btn"
                style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                onClick={handleDisconnect}
                title="Putuskan akun Google"
              >
                <Unlink size={13} style={{ marginRight: 4 }} /> Putuskan
              </button>
            )}
          </div>
        </div>

        {/* Sync Controls */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <form onSubmit={handleSaveConfig} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Google Drive Folder ID atau URL Folder
              </label>
              <input
                type="text"
                className="field-input"
                style={{ width: '100%', padding: '9px 12px' }}
                placeholder="Contoh: 1pnz9oBwHcE_mdU0PQnl7j4NoO0LFt8bd"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <button
                type="submit"
                className="action-btn"
                disabled={savingConfig || !folderInput.trim()}
                style={{ height: 40, padding: '0 16px' }}
              >
                <Save size={14} style={{ marginRight: 6 }} /> Simpan ID
              </button>

              {gdriveFolderUrl && (
                <a
                  href={gdriveFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="action-btn"
                  style={{
                    height: 40,
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-secondary)',
                    textDecoration: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                  }}
                  title="Buka folder di Google Drive"
                >
                  <ExternalLink size={14} style={{ marginRight: 6 }} /> Buka Drive
                </a>
              )}
            </div>
          </form>

          {/* Sync Trigger and Stats Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} /> Terakhir Sinkron: <strong style={{ color: 'var(--text-primary)' }}>{status?.last_sync || 'Belum pernah'}</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} /> Total di Database: <strong style={{ color: 'var(--text-primary)' }}>{filesData?.total_active_in_db || 0} Dokumen</strong>
              </div>
            </div>

            <button
              className="action-btn primary"
              style={{
                height: 38,
                padding: '0 20px',
                background: 'var(--accent-blue)',
                color: '#fff',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={handleRunSync}
              disabled={syncing || !status?.is_authenticated || !folderInput.trim()}
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Menyinkronkan Dokumen...' : 'Sinkronkan Sekarang'}
            </button>
          </div>
        </div>

        {/* Sync Summary Result Banner if available */}
        {syncResult && (
          <div className="kb-sync-result-box">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-blue-light)', marginBottom: 8 }}>
              Hasil Sinkronisasi Terakhir
            </div>
            <div className="kb-metrics-grid">
              <div className="kb-metric-card">
                <span className="kb-metric-title">Baru Diunduh</span>
                <span className="kb-metric-value" style={{ color: '#4ade80' }}>
                  {syncResult.downloaded?.length || 0}
                </span>
              </div>
              <div className="kb-metric-card">
                <span className="kb-metric-title">Diperbarui</span>
                <span className="kb-metric-value" style={{ color: '#60a5fa' }}>
                  {syncResult.updated?.length || 0}
                </span>
              </div>
              <div className="kb-metric-card">
                <span className="kb-metric-title">Dihapus</span>
                <span className="kb-metric-value" style={{ color: '#f87171' }}>
                  {syncResult.deleted?.length || 0}
                </span>
              </div>
              <div className="kb-metric-card">
                <span className="kb-metric-title">Tidak Berubah</span>
                <span className="kb-metric-value" style={{ color: '#94a3b8' }}>
                  {syncResult.skipped?.length || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document Knowledge Base Table Card */}
      <div className="form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.05em', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Dokumen Knowledge Base Aktif ({filteredDocs.length})
            </h2>
            <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Dokumen yang tersedia untuk referensi chatbot dan pembuatan dokumen tender otomatis
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="kb-search-bar">
              <Search size={14} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Cari nama dokumen..."
                className="kb-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              className="action-btn"
              onClick={loadData}
              title="Segarkan daftar dokumen"
              style={{ padding: '8px 12px' }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="kb-file-table-wrap">
          <table className="kb-file-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Judul Dokumen</th>
                <th style={{ width: '15%' }}>Format</th>
                <th style={{ width: '40%' }}>Waktu Pengindeksan</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    {searchQuery ? 'Tidak ada dokumen yang cocok dengan pencarian.' : 'Belum ada dokumen yang terindeks di knowledge base.'}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isPdf = doc.file_format?.toLowerCase() === 'pdf' || doc.title?.toLowerCase().endsWith('.pdf')
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={16} color={isPdf ? '#f87171' : '#60a5fa'} />
                          <span style={{ fontWeight: 500 }}>{doc.title}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`file-type-badge ${isPdf ? 'pdf' : 'docx'}`}>
                          {doc.file_format || (isPdf ? 'PDF' : 'DOCX')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {doc.indexed_at
                          ? new Date(doc.indexed_at).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
