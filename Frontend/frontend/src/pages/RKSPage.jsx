import React, { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react'
import { rksService } from '../services/api'
import './FormPage.css'

export default function RKSPage() {
  const [query, setQuery] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const data = await rksService.generate({ query, source_id: sourceId })
      setResult(data)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-page-header">
        <div className="page-icon-wrap"><FileText size={22} /></div>
        <div>
          <h1 className="form-page-title">Generate Dokumen RKS</h1>
          <p className="form-page-subtitle">
            Buat Rencana Kerja dan Syarat-Syarat secara otomatis dari knowledge base Pertamina
          </p>
        </div>
      </div>

      {error && (
        <div className="form-error">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      <form className="form-card" onSubmit={handleGenerate}>
        <div className="field-group">
          <label className="field-label">Deskripsi Pengadaan *</label>
          <textarea
            className="field-input field-textarea"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="cth. Pengadaan jasa katering untuk kantor regional Sumatera, kapasitas 200 orang, durasi 12 bulan…"
            rows={4}
            required
          />
          <span className="field-hint">
            Deskripsikan kebutuhan pengadaan sedetail mungkin agar hasil RKS lebih akurat.
          </span>
        </div>

        <div className="field-group">
          <label className="field-label">ID Sumber Dokumen (Opsional)</label>
          <input
            className="field-input"
            value={sourceId}
            onChange={e => setSourceId(e.target.value)}
            placeholder="Kosongkan untuk seleksi otomatis"
          />
          <span className="field-hint">
            Jika Anda tahu ID dokumen referensi tertentu, isi di sini. Jika tidak, sistem akan memilih otomatis.
          </span>
        </div>

        <button type="submit" className="primary-btn" disabled={!query.trim() || loading}>
          {loading
            ? <><Loader2 size={15} className="spin" /> Membuat RKS…</>
            : '📄 Generate Dokumen RKS'}
        </button>
      </form>

      {result && (
        <div className="form-card result-card">
          <div className="result-icon"><CheckCircle size={36} /></div>
          <h2 className="result-title">RKS Berhasil Dibuat!</h2>
          {result.filename && <p className="result-filename">{result.filename}</p>}
          {result.message && <p className="result-message">{result.message}</p>}
          {result.filename && (
            <div className="result-actions">
              <a
                href={rksService.downloadUrl(result.filename)}
                download
                className="primary-btn"
              >
                <Download size={15} /> Unduh DOCX
              </a>
              <button className="secondary-btn" onClick={() => { setResult(null); setQuery(''); setSourceId('') }}>
                Buat RKS Lain
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
