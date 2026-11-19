import React, { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  FolderOpen,
  FolderPlus,
  Trash2,
  X,
  RotateCcw,
} from 'lucide-react'
import { tenderService, getErrorMessage } from '../services/api'
import './FormPage.css'

function FieldGroup({ label, children, hint }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}

export default function TenderPage() {
  const [step, setStep] = useState(1) // 1=upload, 2=form, 3=result
  const [rksFile, setRksFile] = useState(null)
  const [boqFile, setBoqFile] = useState(null)
  const [dp3Files, setDp3Files] = useState([])

  // DP3 extraction results & state
  const [dp3Summary, setDp3Summary] = useState('')
  const [savedDp3Summary, setSavedDp3Summary] = useState('')
  const [dp3FilesProcessed, setDp3FilesProcessed] = useState([])
  const [dp3FilesSkipped, setDp3FilesSkipped] = useState([])
  const [baseContextSummary, setBaseContextSummary] = useState('')

  const [extracting, setExtracting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const [form, setForm] = useState({
    nama_pengadaan: '',
    nomor_tender: '',
    tanggal: '',
    prime_cost: '',
    total_dengan_kr: '',
    resiko_csms: '',
    tkdn_minimal: '0',
    pejabat_procurement_nama: '',
    pejabat_procurement_jabatan: '',
    pejabat_berwenang: '',
    pengawas_pekerjaan: '',
    metode_pemenuhan: '',
    jenis_kontrak: '',
    prebid_tanggal: '',
    prebid_waktu: '',
    prebid_tempat: '',
    pemasukan_mulai: '',
    pemasukan_selesai: '',
    output_filename: '',
    // Extracted metadata passed along to backend generator
    context_summary: '',
    boq_items: null,
    officials: null,
    rks_artifact_id: null,
  })

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleExtract = async () => {
    setError(null)
    setExtracting(true)
    try {
      const fd = new FormData()
      if (rksFile) fd.append('rks_file', rksFile)
      if (boqFile) fd.append('boq_file', boqFile)
      if (dp3Files && dp3Files.length > 0) {
        dp3Files.forEach(f => fd.append('dp3_files', f))
      }

      const data = await tenderService.extractContext(fd)

      const dp3Text = data.dp3_summary || ''
      const baseText = data.base_context_summary || ''
      setDp3Summary(dp3Text)
      setSavedDp3Summary(dp3Text)
      setDp3FilesProcessed(data.dp3_files_processed || [])
      setDp3FilesSkipped(data.dp3_files_skipped || [])
      setBaseContextSummary(baseText)

      setForm(f => ({
        ...f,
        nama_pengadaan: data.nama_pengadaan || f.nama_pengadaan,
        resiko_csms: data.resiko_csms || f.resiko_csms,
        prime_cost: data.prime_cost != null ? String(data.prime_cost) : f.prime_cost,
        total_dengan_kr: data.total_dengan_kr != null ? String(data.total_dengan_kr) : f.total_dengan_kr,
        context_summary: data.combined_context_summary || f.context_summary,
        boq_items: data.boq_items?.length ? data.boq_items : f.boq_items,
        officials: data.officials || f.officials,
        rks_artifact_id: data.rks_artifact_id || f.rks_artifact_id,
      }))
      setStep(2)
    } catch (e) {
      setError(getErrorMessage(e, 'Gagal mengekstrak konteks dari dokumen.'))
    } finally {
      setExtracting(false)
    }
  }

  // Handle manual edits to DP3 summary in Step 2
  const handleEditDp3Summary = (newVal) => {
    setDp3Summary(newVal)
    const combined = newVal.trim()
      ? `${baseContextSummary}\n\n--- DOKUMEN PENDUKUNG (DP3) ---\n${newVal.trim()}`
      : baseContextSummary
    setForm(f => ({ ...f, context_summary: combined }))
  }

  // Dismiss / remove DP3 context from tender document
  const handleRemoveDp3 = () => {
    setDp3Summary('')
    setDp3FilesProcessed([])
    setDp3FilesSkipped([])
    setForm(f => ({ ...f, context_summary: baseContextSummary }))
  }

  // Restore DP3 context if user dismissed it by mistake
  const handleRestoreDp3 = () => {
    setDp3Summary(savedDp3Summary)
    const combined = savedDp3Summary.trim()
      ? `${baseContextSummary}\n\n--- DOKUMEN PENDUKUNG (DP3) ---\n${savedDp3Summary.trim()}`
      : baseContextSummary
    setForm(f => ({ ...f, context_summary: combined }))
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError(null)
    setGenerating(true)
    try {
      const payload = {
        ...form,
        prime_cost: form.prime_cost ? parseFloat(form.prime_cost) : null,
        total_dengan_kr: form.total_dengan_kr ? parseFloat(form.total_dengan_kr) : null,
        tkdn_minimal: parseFloat(form.tkdn_minimal) || 0,
      }
      const data = await tenderService.generate(payload)
      setResult(data)
      setStep(3)
    } catch (e) {
      setError(getErrorMessage(e, 'Gagal menghasilkan Dokumen Tender.'))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-page-header">
        <div className="page-icon-wrap">
          <ClipboardList size={22} />
        </div>
        <div>
          <h1 className="form-page-title">Generate Dokumen Tender</h1>
          <p className="form-page-subtitle">
            Unggah RKS, BOQ, dan Dokumen Pendukung (DP3) untuk membuat Dokumen Tender Pertamina secara otomatis
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="steps-indicator">
        {['Upload Dokumen', 'Isi Form', 'Unduh Hasil'].map((s, i) => (
          <React.Fragment key={i}>
            <div className={`step-dot ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
              {step > i + 1 ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
              <span className="step-label">{s}</span>
            </div>
            {i < 2 && <div className={`step-line ${step > i + 1 ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="form-error">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="form-card">
          <div className="upload-grid">
            <DropZone label="1. File RKS (PDF / DOCX) *" file={rksFile} onChange={setRksFile} required />
            <DropZone label="2. File BOQ (PDF / Excel)" file={boqFile} onChange={setBoqFile} optional />
          </div>

          <Dp3DropZone files={dp3Files} onChange={setDp3Files} />

          <button
            className="primary-btn"
            onClick={handleExtract}
            disabled={!rksFile || extracting}
          >
            {extracting ? <><Loader2 size={15} className="spin" /> Mengekstrak Konteks…</> : 'Lanjut →'}
          </button>
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && (
        <form className="form-card" onSubmit={handleGenerate}>
          {/* DP3 Summary Accordion Card */}
          {dp3Summary ? (
            <details className="dp3-summary-card" open>
              <summary className="dp3-summary-header">
                <div className="dp3-summary-title">
                  <FolderOpen size={18} className="dp3-icon" />
                  <span>
                    Dokumen Pendukung (DP3) Terintegrasi ({dp3FilesProcessed.length || 'Berkas'} dokumen)
                  </span>
                </div>
                <button
                  type="button"
                  className="dp3-dismiss-btn"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemoveDp3()
                  }}
                  title="Hapus konteks DP3 dari Dokumen Tender"
                >
                  <Trash2 size={13} /> Hapus Konteks DP3
                </button>
              </summary>

              <div className="dp3-summary-content">
                {dp3FilesProcessed.length > 0 && (
                  <div className="dp3-files-list">
                    <span className="dp3-sublabel">Berkas terbaca:</span>
                    <div className="dp3-badge-list">
                      {dp3FilesProcessed.map((file, idx) => (
                        <span key={idx} className="dp3-file-badge" title={file.snippet || file.filename}>
                          <FileText size={12} />
                          <span className="dp3-badge-name">{file.filename}</span>
                          <span className="dp3-badge-size">({file.size_kb} KB)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {dp3FilesSkipped?.length > 0 && (
                  <div className="dp3-skipped-box">
                    <span className="dp3-skipped-title">⚠️ {dp3FilesSkipped.length} berkas dilewati (format tidak didukung):</span>
                    <ul className="dp3-skipped-list">
                      {dp3FilesSkipped.map((s, idx) => (
                        <li key={idx}><strong>{s.filename}</strong>: {s.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="dp3-extracted-text">
                  <label className="field-label">Poin Kunci Dokumen Pendukung (DP3) yang Ditemukan AI:</label>
                  <textarea
                    className="field-input field-textarea dp3-textarea"
                    value={dp3Summary}
                    onChange={(e) => handleEditDp3Summary(e.target.value)}
                    rows={6}
                    placeholder="Poin-poin spesifikasi teknis, kualifikasi, atau HSSE dari dokumen DP3..."
                  />
                  <small className="field-hint">
                    Poin ini otomatis dimasukkan ke dalam Lampiran 2A (Kriteria Evaluasi Teknis) dan Pasal 2 (Lingkup Pekerjaan). Anda dapat mengedit teks di atas sesuai kebutuhan.
                  </small>
                </div>
              </div>
            </details>
          ) : savedDp3Summary ? (
            <div className="dp3-dismissed-banner">
              <span>Konteks DP3 telah dinonaktifkan untuk dokumen tender ini.</span>
              <button type="button" className="dp3-restore-btn" onClick={handleRestoreDp3}>
                <RotateCcw size={13} /> Pulihkan Konteks DP3
              </button>
            </div>
          ) : null}

          <div className="form-grid">
            <FieldGroup label="Nama Pengadaan *">
              <input className="field-input" value={form.nama_pengadaan} onChange={e => setField('nama_pengadaan', e.target.value)} required />
            </FieldGroup>
            <FieldGroup label="Nomor Tender">
              <input className="field-input" value={form.nomor_tender} onChange={e => setField('nomor_tender', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Tanggal Dokumen">
              <input className="field-input" type="date" value={form.tanggal} onChange={e => setField('tanggal', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Risiko CSMS">
              <select className="field-input" value={form.resiko_csms} onChange={e => setField('resiko_csms', e.target.value)}>
                <option value="">— Pilih —</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </select>
            </FieldGroup>
            <FieldGroup label="HPS Prime Cost (Rp)" hint="Contoh: 1500000000">
              <input className="field-input" type="number" value={form.prime_cost} onChange={e => setField('prime_cost', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Total HPS dengan KR (Rp)">
              <input className="field-input" type="number" value={form.total_dengan_kr} onChange={e => setField('total_dengan_kr', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="TKDN Minimal (%)">
              <input className="field-input" type="number" min="0" max="100" value={form.tkdn_minimal} onChange={e => setField('tkdn_minimal', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Metode Pemenuhan">
              <input className="field-input" value={form.metode_pemenuhan} onChange={e => setField('metode_pemenuhan', e.target.value)} placeholder="cth. Tender Terbuka" />
            </FieldGroup>
            <FieldGroup label="Jenis Kontrak">
              <input className="field-input" value={form.jenis_kontrak} onChange={e => setField('jenis_kontrak', e.target.value)} placeholder="cth. Lump Sum" />
            </FieldGroup>
            <FieldGroup label="Pejabat Procurement – Nama">
              <input className="field-input" value={form.pejabat_procurement_nama} onChange={e => setField('pejabat_procurement_nama', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Pejabat Procurement – Jabatan">
              <input className="field-input" value={form.pejabat_procurement_jabatan} onChange={e => setField('pejabat_procurement_jabatan', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Pejabat Berwenang">
              <input className="field-input" value={form.pejabat_berwenang} onChange={e => setField('pejabat_berwenang', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Pengawas Pekerjaan">
              <input className="field-input" value={form.pengawas_pekerjaan} onChange={e => setField('pengawas_pekerjaan', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Tanggal Pre-Bid Meeting">
              <input className="field-input" type="date" value={form.prebid_tanggal} onChange={e => setField('prebid_tanggal', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Waktu Pre-Bid">
              <input className="field-input" type="time" value={form.prebid_waktu} onChange={e => setField('prebid_waktu', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Tempat Pre-Bid">
              <input className="field-input" value={form.prebid_tempat} onChange={e => setField('prebid_tempat', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Pemasukan Penawaran – Mulai">
              <input className="field-input" type="datetime-local" value={form.pemasukan_mulai} onChange={e => setField('pemasukan_mulai', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Pemasukan Penawaran – Selesai">
              <input className="field-input" type="datetime-local" value={form.pemasukan_selesai} onChange={e => setField('pemasukan_selesai', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Nama File Output" hint="Opsional, tanpa ekstensi .docx">
              <input className="field-input" value={form.output_filename} onChange={e => setField('output_filename', e.target.value)} placeholder="Dokumen_Tender_ProyekXYZ" />
            </FieldGroup>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={() => setStep(1)}>← Kembali</button>
            <button type="submit" className="primary-btn" disabled={generating}>
              {generating ? <><Loader2 size={15} className="spin" /> Membuat Dokumen…</> : '🚀 Generate Dokumen Tender'}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="form-card result-card">
          <div className="result-icon"><CheckCircle size={36} /></div>
          <h2 className="result-title">Dokumen Berhasil Dibuat!</h2>
          <p className="result-filename">{result.filename}</p>
          {result.contract_archive_warning && (
            <div className="result-warning"><AlertCircle size={14} /> {result.contract_archive_warning}</div>
          )}
          <div className="result-actions">
            <a
              href={tenderService.downloadUrl(result.filename)}
              download
              className="primary-btn"
            >
              <Download size={15} /> Unduh DOCX
            </a>
            <button className="secondary-btn" onClick={() => { setStep(1); setResult(null); setError(null) }}>
              Buat Dokumen Lain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DropZone({ label, file, onChange, optional }) {
  const inputRef = useRef(null)
  return (
    <div
      className={`drop-zone ${file ? 'has-file' : ''}`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        accept=".pdf,.docx,.xlsx,.xls"
        onChange={e => onChange(e.target.files[0] || null)}
      />
      {file ? (
        <div className="drop-zone-file">
          <FileText size={20} />
          <span>{file.name}</span>
        </div>
      ) : (
        <div className="drop-zone-placeholder">
          <Upload size={22} />
          <span>{label}{optional ? ' (Opsional)' : ''}</span>
          <small>Klik untuk pilih file tunggal</small>
        </div>
      )}
    </div>
  )
}

function Dp3DropZone({ files, onChange }) {
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)

  const handleAddFiles = (newFiles) => {
    if (!newFiles || newFiles.length === 0) return
    const fileArray = Array.from(newFiles)
    onChange(prev => {
      const existingKeys = new Set(prev.map(f => `${f.name}-${f.size}`))
      const uniqueNew = fileArray.filter(f => !existingKeys.has(`${f.name}-${f.size}`))
      return [...prev, ...uniqueNew]
    })
  }

  const handleRemoveFile = (indexToRemove) => {
    onChange(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className="dp3-drop-zone">
      <div className="dp3-drop-header">
        <label className="field-label" style={{ marginBottom: 0 }}>
          3. Dokumen Pendukung (DP3) Lainnya (Opsional)
        </label>
        {files.length > 0 && (
          <button type="button" className="dp3-clear-btn" onClick={handleClearAll}>
            Hapus Semua ({files.length})
          </button>
        )}
      </div>

      <div
        className="drop-zone dp3-box"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files) {
            handleAddFiles(e.dataTransfer.files)
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          accept=".pdf,.docx,.xlsx,.xls,.txt,.zip"
          multiple
          onChange={(e) => {
            handleAddFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          style={{ display: 'none' }}
          webkitdirectory=""
          directory=""
          multiple
          onChange={(e) => {
            handleAddFiles(e.target.files)
            e.target.value = ''
          }}
        />

        <div className="dp3-box-content">
          <FolderPlus size={28} className="dp3-box-icon" />
          <span className="dp3-box-title">Unggah Folder atau Beberapa File DP3</span>
          <small className="dp3-box-desc">
            Mendukung PDF, Word (DOCX), Excel (XLSX/XLS), TXT, arsip ZIP, atau pilih Folder langsung
          </small>
          <div className="dp3-action-buttons">
            <button
              type="button"
              className="dp3-pick-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Pilih File / ZIP
            </button>
            <button
              type="button"
              className="dp3-pick-btn secondary"
              onClick={() => folderInputRef.current?.click()}
            >
              <FolderOpen size={14} /> Pilih Folder DP3
            </button>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="dp3-selected-list">
          <div className="dp3-selected-title">
            <span>{files.length} dokumen DP3 dipilih untuk dianalisis AI:</span>
          </div>
          <div className="dp3-chips">
            {files.map((f, i) => (
              <span key={`${f.name}-${i}`} className="dp3-chip" title={f.name}>
                <FileText size={13} className="dp3-chip-icon" />
                <span className="dp3-chip-name">{f.name}</span>
                <span className="dp3-chip-size">({(f.size / 1024).toFixed(0)} KB)</span>
                <button
                  type="button"
                  className="dp3-chip-remove"
                  onClick={() => handleRemoveFile(i)}
                  title="Hapus file ini"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
