import React, { useState } from 'react'
import { FilePen, AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react'
import api from '../services/api'
import './FormPage.css'

export default function AmandemenPage() {
  const [form, setForm] = useState({
    contract_id: '',
    amendment_description: '',
    amendment_number: '',
    amendment_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      // Uses the LangGraph agent via chat with a structured prompt
      const { data } = await api.post('/chat', {
        thread_id: null,
        message: `Generate dokumen amandemen kontrak dengan detail berikut:\n- ID Kontrak: ${form.contract_id}\n- Nomor Amandemen: ${form.amendment_number}\n- Tanggal: ${form.amendment_date}\n- Deskripsi Perubahan: ${form.amendment_description}`,
      })
      setResult({ message: 'Permintaan amandemen telah dikirim ke asisten. Lihat hasil di halaman Chat.', thread_id: data?.thread_id })
    } catch (err) {
      setError(err?.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-page-header">
        <div className="page-icon-wrap"><FilePen size={22} /></div>
        <div>
          <h1 className="form-page-title">Generate Dokumen Amandemen</h1>
          <p className="form-page-subtitle">
            Buat dokumen amandemen kontrak berdasarkan kontrak yang sudah tersimpan di sistem
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
        <div className="form-grid">
          <div className="field-group">
            <label className="field-label">ID Kontrak *</label>
            <input
              className="field-input"
              value={form.contract_id}
              onChange={e => setField('contract_id', e.target.value)}
              placeholder="cth. abc12345-…"
              required
            />
            <span className="field-hint">ID kontrak yang tersimpan di gudang kontrak sistem</span>
          </div>

          <div className="field-group">
            <label className="field-label">Nomor Amandemen</label>
            <input
              className="field-input"
              value={form.amendment_number}
              onChange={e => setField('amendment_number', e.target.value)}
              placeholder="cth. AMD-001"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Tanggal Amandemen</label>
            <input
              className="field-input"
              type="date"
              value={form.amendment_date}
              onChange={e => setField('amendment_date', e.target.value)}
            />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Deskripsi Perubahan *</label>
          <textarea
            className="field-input field-textarea"
            value={form.amendment_description}
            onChange={e => setField('amendment_description', e.target.value)}
            placeholder="Jelaskan perubahan yang perlu diakomodir dalam amandemen ini…"
            rows={5}
            required
          />
        </div>

        <button type="submit" className="primary-btn" disabled={!form.contract_id || !form.amendment_description || loading}>
          {loading
            ? <><Loader2 size={15} className="spin" /> Membuat Amandemen…</>
            : '📋 Generate Dokumen Amandemen'}
        </button>
      </form>

      {result && (
        <div className="form-card result-card">
          <div className="result-icon"><CheckCircle size={36} /></div>
          <h2 className="result-title">Permintaan Dikirim!</h2>
          <p className="result-message">{result.message}</p>
          <div className="result-actions">
            <a href="/" className="primary-btn">Lihat di Chat →</a>
            <button className="secondary-btn" onClick={() => { setResult(null); setForm({ contract_id: '', amendment_description: '', amendment_number: '', amendment_date: '' }) }}>
              Buat Amandemen Lain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
