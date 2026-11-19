import React, { useState } from 'react'
import { FileText, AlertCircle, CheckCircle, Download, ExternalLink, Loader2 } from 'lucide-react'
import { rksService, getErrorMessage } from '../services/api'
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
      if (data.status === 'gagal') {
        setError(data.message || 'Pembuatan RKS gagal diproses.')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Terjadi kesalahan saat membuat RKS.'))
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
            Jika Anda tahu ID dokumen referensi tertentu dari katalog, isi di sini. Jika tidak, sistem akan memilih otomatis.
          </span>
        </div>

        <button type="submit" className="primary-btn" disabled={!query.trim() || loading}>
          {loading
            ? <><Loader2 size={15} className="spin" /> Membuat RKS…</>
            : '📄 Generate Dokumen RKS'}
        </button>
      </form>

      {result && result.artifact_id && (
        <div className="form-card result-card">
          <div className="result-icon"><CheckCircle size={36} /></div>
          <h2 className="result-title">
            {result.mode === 'template umum' ? 'Template Umum RKS Berhasil Dibuat' : 'RKS Berhasil Dibuat!'}
          </h2>
          <p className="result-filename">ID Dokumen: {result.artifact_id}</p>
          {result.message && <p className="result-message">{result.message}</p>}

          <div className="result-actions">
            <a
              href={rksService.downloadDocxUrl(result.artifact_id)}
              download={`RKS-${result.artifact_id.slice(0, 8)}.docx`}
              className="primary-btn"
            >
              <Download size={15} /> Unduh DOCX
            </a>
            <a
              href={rksService.downloadPdfUrl(result.artifact_id)}
              target="_blank"
              rel="noreferrer"
              className="secondary-btn"
            >
              <ExternalLink size={15} /> Pratinjau PDF
            </a>
            <button
              className="secondary-btn"
              onClick={() => { setResult(null); setQuery(''); setSourceId('') }}
            >
              Buat RKS Lain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
