import React, { useState } from 'react'
import { Upload, FileText, ClipboardList, AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react'
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
      const data = await tenderService.extractContext(fd)
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
          <p className="form-page-subtitle">Unggah RKS & BOQ untuk membuat Dokumen Tender Pertamina secara otomatis</p>
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
            <DropZone label="File RKS (PDF / DOCX)" file={rksFile} onChange={setRksFile} />
            <DropZone label="File BOQ (PDF / Excel)" file={boqFile} onChange={setBoqFile} optional />
          </div>
          <button
            className="primary-btn"
            onClick={handleExtract}
            disabled={!rksFile || extracting}
          >
            {extracting ? <><Loader2 size={15} className="spin" /> Mengekstrak…</> : 'Lanjut →'}
          </button>
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && (
        <form className="form-card" onSubmit={handleGenerate}>
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
  const inputRef = React.useRef(null)
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
          <small>Klik untuk pilih file</small>
        </div>
      )}
    </div>
  )
}
