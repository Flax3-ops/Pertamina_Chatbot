import React, { useState, useEffect, useCallback } from 'react'
import {
  FilePen,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  History,
  Sparkles,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { amendmentService, getErrorMessage } from '../services/api'
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

export default function AmandemenPage() {
  const [tab, setTab] = useState('generate') // 'generate' | 'history'
  const [contracts, setContracts] = useState([])
  const [selectedContractId, setSelectedContractId] = useState('template_ikn')
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [loadingContext, setLoadingContext] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [form, setForm] = useState({
    contract_id: 'template_ikn',
    project_name: 'Pembangunan DPPU Nusantara Ibu Kota Negara (IKN) – Penajam Paser Utara',
    contract_ref: 'SP-068/PND900000/2024-S0',
    contract_date: '25 April 2024',
    amendment_level: 'Amendemen II',
    tanggal_amendemen: '',
    company_name: 'PT Pertamina Patra Niaga',
    company_office: 'Jakarta Selatan dan berkantor pusat di Gedung Wisma Tugu II Lantai 2, Jalan HR. Rasuna Said Kav. C7-9, Kota Administrasi Jakarta Selatan, Provinsi DKI Jakarta',
    company_rep_name: 'Riki Madyanto',
    company_rep_title: 'Sr. Manager Opt. & Maint. Kalimantan',
    contractor_name: 'PT PGAS Solution',
    contractor_office: 'Jakarta Pusat dan berkantor pusat di Jakarta',
    contractor_rep_name: 'Heru Indriatno',
    contractor_rep_title: 'Direktur Teknik dan Pengembangan',
    nilai_pekerjaan_baru: 28642900000,
    tanggal_sp3mk: '14 Maret 2024',
    nomor_sp3mk: 'SP3MK-007/PND900000/2024-S0',
    durasi_bulan_pemeliharaan: 6,
    tanggal_berlaku_amendemen: '04 September 2025',
    mpp_hari: 839,
    mpl_hari: 749,
    mpa_hari: 90,
    mpl_tanggal: '01 April 2026',
    mpa_tanggal: '30 Juni 2026',
    durasi_kontrak_hari: 180,
    tanggal_akhir_kontrak: '25 Juni 2027',
    lingkup_pekerjaan: '2. Pekerjaan yang harus dilaksanakan oleh KONTRAKTOR adalah Pembangunan DPPU Nusantara Ibu Kota Negara (IKN) – Penajam Paser Utara dengan ruang lingkup sebagaimana diuraikan dalam Lampiran B-I AMENDEMEN II.',
    tambahan_pekerjaan: '3. Pekerjaan yang harus dilaksanakan oleh KONTRAKTOR Pengadaan 1 (Satu) Unit Pompa PMK Kap. 3000 GPM di IT Balikpapan dengan ruang lingkup sebagaimana diuraikan dalam Lampiran B KONTRAK dengan penambahan terdapat dalam Lampiran B-I AMENDEMEN II.',
    dasar_dokumen_text: [
      'Surat KONTRAKTOR kepada PERUSAHAAN No.10150.S/DPPU-IKN/PGAS/XI/2025 tanggal 21 November 2025 perihal Revisi Penawaran Harga dan Waktu pada Pembangunan DPPU Nusantara Ibu Kota Negara (IKN) – Penajam Paser Utara;',
      'Notulen Rapat No.NR-794/PND95C000/2025-S5 tanggal 13 Oktober 2025 perihal War Room dan Pembahasan Pengajuan Amendemen Pekerjaan Pembangunan DPPU Ibu Kota Nusantara (IKN) Penajam Paser Utara;',
      'Notulen Rapat No.NR-950/PND95C000/2025-S5 tanggal 18 November 2025 perihal Pembahasan Pengajuan Amendemen Pekerjaan Pembangunan DPPU Ibu Kota Nusantara (IKN) Penajam Paser Utara;',
      'Berita Acara Klarifikasi dan Negosiasi Amendemen Waktu dan Biaya No.951/PND95C000/2025-S5 tanggal 02 Desember 2025.',
    ].join('\n'),
  })

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // 1. Load available contracts on mount
  const loadContracts = useCallback(async () => {
    setLoadingContracts(true)
    try {
      const res = await amendmentService.listContracts()
      const list = res.contracts || []
      setContracts(list)
      if (list.length > 0 && !selectedContractId) {
        setSelectedContractId(list[0].id)
      }
    } catch {
      // Keep default template fallback
    } finally {
      setLoadingContracts(false)
    }
  }, [selectedContractId])

  // 2. Load context when a contract is selected
  const loadContractContext = useCallback(async (contractId) => {
    if (!contractId) return
    setLoadingContext(true)
    setError(null)
    try {
      const res = await amendmentService.getContractContext(contractId)
      const ctx = res.context || {}
      setForm(prev => ({
        ...prev,
        contract_id: contractId,
        project_name: ctx.project_name || prev.project_name,
        contract_ref: ctx.contract_ref || prev.contract_ref,
        contract_date: ctx.contract_date || prev.contract_date,
        amendment_level: ctx.amendment_level || prev.amendment_level,
        tanggal_amendemen: ctx.tanggal_amendemen || prev.tanggal_amendemen,
        company_name: ctx.company_name || prev.company_name,
        company_office: ctx.company_office || prev.company_office,
        company_rep_name: ctx.company_rep_name || prev.company_rep_name,
        company_rep_title: ctx.company_rep_title || prev.company_rep_title,
        contractor_name: ctx.contractor_name || prev.contractor_name,
        contractor_office: ctx.contractor_office || prev.contractor_office,
        contractor_rep_name: ctx.contractor_rep_name || prev.contractor_rep_name,
        contractor_rep_title: ctx.contractor_rep_title || prev.contractor_rep_title,
        nilai_pekerjaan_baru: ctx.nilai_pekerjaan_baru || prev.nilai_pekerjaan_baru,
        tanggal_sp3mk: ctx.tanggal_sp3mk || prev.tanggal_sp3mk,
        nomor_sp3mk: ctx.nomor_sp3mk || prev.nomor_sp3mk,
        durasi_bulan_pemeliharaan: ctx.durasi_bulan_pemeliharaan || prev.durasi_bulan_pemeliharaan,
        tanggal_berlaku_amendemen: ctx.tanggal_berlaku_amendemen || prev.tanggal_berlaku_amendemen,
        mpp_hari: ctx.mpp_hari || prev.mpp_hari,
        mpl_hari: ctx.mpl_hari || prev.mpl_hari,
        mpa_hari: ctx.mpa_hari || prev.mpa_hari,
        mpl_tanggal: ctx.mpl_tanggal || prev.mpl_tanggal,
        mpa_tanggal: ctx.mpa_tanggal || prev.mpa_tanggal,
        durasi_kontrak_hari: ctx.durasi_kontrak_hari || prev.durasi_kontrak_hari,
        tanggal_akhir_kontrak: ctx.tanggal_akhir_kontrak || prev.tanggal_akhir_kontrak,
        lingkup_pekerjaan: ctx.lingkup_pekerjaan || prev.lingkup_pekerjaan,
        tambahan_pekerjaan: ctx.tambahan_pekerjaan || prev.tambahan_pekerjaan,
        dasar_dokumen_text: Array.isArray(ctx.dasar_dokumen) ? ctx.dasar_dokumen.join('\n') : prev.dasar_dokumen_text,
      }))
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat konteks kontrak acuan.'))
    } finally {
      setLoadingContext(false)
    }
  }, [])

  // 3. Load history
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await amendmentService.listHistory()
      setHistoryList(res.amendments || [])
    } catch {
      setHistoryList([])
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    loadContracts()
  }, [loadContracts])

  useEffect(() => {
    if (tab === 'history') {
      loadHistory()
    }
  }, [tab, loadHistory])

  const handleContractChange = (e) => {
    const id = e.target.value
    setSelectedContractId(id)
    loadContractContext(id)
  }

  // Handle Generate Submission
  const handleGenerate = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setGenerating(true)

    try {
      const dasarList = form.dasar_dokumen_text
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)

      const payload = {
        contract_id: selectedContractId,
        project_name: form.project_name.trim(),
        contract_ref: form.contract_ref.trim(),
        contract_date: form.contract_date.trim(),
        amendment_level: form.amendment_level.trim(),
        tanggal_amendemen: form.tanggal_amendemen.trim(),
        company_name: form.company_name.trim(),
        company_office: form.company_office.trim(),
        company_rep_name: form.company_rep_name.trim(),
        company_rep_title: form.company_rep_title.trim(),
        contractor_name: form.contractor_name.trim(),
        contractor_office: form.contractor_office.trim(),
        contractor_rep_name: form.contractor_rep_name.trim(),
        contractor_rep_title: form.contractor_rep_title.trim(),
        nilai_pekerjaan_baru: Number(form.nilai_pekerjaan_baru) || 0,
        tanggal_sp3mk: form.tanggal_sp3mk.trim(),
        nomor_sp3mk: form.nomor_sp3mk.trim(),
        durasi_bulan_pemeliharaan: Number(form.durasi_bulan_pemeliharaan) || 6,
        tanggal_berlaku_amendemen: form.tanggal_berlaku_amendemen.trim(),
        mpp_hari: Number(form.mpp_hari) || 839,
        mpl_hari: Number(form.mpl_hari) || 749,
        mpa_hari: Number(form.mpa_hari) || 90,
        mpl_tanggal: form.mpl_tanggal.trim(),
        mpa_tanggal: form.mpa_tanggal.trim(),
        durasi_kontrak_hari: Number(form.durasi_kontrak_hari) || 180,
        tanggal_akhir_kontrak: form.tanggal_akhir_kontrak.trim(),
        lingkup_pekerjaan: form.lingkup_pekerjaan.trim(),
        tambahan_pekerjaan: form.tambahan_pekerjaan?.trim() || null,
        dasar_dokumen: dasarList.length > 0 ? dasarList : null,
      }

      const res = await amendmentService.generate(payload)
      setResult(res)
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menyusun dokumen amandemen kontrak.'))
    } finally {
      setGenerating(false)
    }
  }

  const formatRupiah = (val) => {
    const num = Number(val) || 0
    return 'Rp ' + num.toLocaleString('id-ID')
  }

  return (
    <div className="form-page">
      {/* Header */}
      <div className="form-page-header">
        <div className="page-icon-wrap"><FilePen size={22} /></div>
        <div>
          <h1 className="form-page-title">Generate Dokumen Amandemen Kontrak</h1>
          <p className="form-page-subtitle">
            Susun paket pokok-pokok amandemen kontrak resmi standar Pertamina lengkap dengan Lampiran B-I, C-I, D-II, G-II & Lembar Pembatas.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          type="button"
          className={`tab-btn ${tab === 'generate' ? 'active' : ''}`}
          onClick={() => setTab('generate')}
        >
          <Sparkles size={15} /> Buat Amandemen
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          <History size={15} /> Riwayat Dokumen
        </button>
      </div>

      {error && (
        <div className="form-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: FORM GENERATOR */}
      {tab === 'generate' && !result && (
        <form className="form-card" onSubmit={handleGenerate}>
          {/* Section 0: Kontrak Acuan */}
          <div className="form-section-title">
            <Layers size={16} /> 1. Kontrak Induk Acuan
          </div>
          <div className="field-group">
            <label className="field-label">Pilih Kontrak Induk *</label>
            <select
              className="field-input"
              value={selectedContractId}
              onChange={handleContractChange}
              disabled={loadingContracts || loadingContext || generating}
            >
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.is_default_template ? '⭐ ' : ''}{c.project_name} ({c.contract_ref || c.id})
                </option>
              ))}
            </select>
            <span className="field-hint">
              Pilih kontrak dari gudang kontrak atau gunakan template resmi bawaan (DPPU Nusantara IKN).
            </span>
          </div>

          <hr className="form-section-divider" />

          {/* Section 1: Pokok Kontrak & Para Pihak */}
          <div className="form-section-title">
            <FileText size={16} /> 2. Pokok-Pokok Kontrak & Identitas Para Pihak
          </div>
          <div className="form-grid">
            <FieldGroup label="Tingkat Amendemen *">
              <select
                className="field-input"
                value={form.amendment_level}
                onChange={e => setField('amendment_level', e.target.value)}
              >
                <option value="Amendemen I">Amendemen I</option>
                <option value="Amendemen II">Amendemen II</option>
                <option value="Amendemen III">Amendemen III</option>
                <option value="Amendemen IV">Amendemen IV</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Nomor Referensi Kontrak Induk *">
              <input
                className="field-input"
                value={form.contract_ref}
                onChange={e => setField('contract_ref', e.target.value)}
                placeholder="cth. SP-068/PND900000/2024-S0"
                required
              />
            </FieldGroup>

            <FieldGroup label="Tanggal Kontrak Induk *">
              <input
                className="field-input"
                value={form.contract_date}
                onChange={e => setField('contract_date', e.target.value)}
                placeholder="cth. 25 April 2024"
                required
              />
            </FieldGroup>

            <FieldGroup label="Tanggal Amandemen Ditandatangani">
              <input
                className="field-input"
                value={form.tanggal_amendemen}
                onChange={e => setField('tanggal_amendemen', e.target.value)}
                placeholder="cth. 02 Desember 2025 (kosongkan untuk hari ini)"
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Nama Pekerjaan / Proyek *">
            <input
              className="field-input"
              value={form.project_name}
              onChange={e => setField('project_name', e.target.value)}
              placeholder="Nama lengkap pekerjaan proyek"
              required
            />
          </FieldGroup>

          <div className="form-grid">
            <FieldGroup label="Pejabat Perusahaan (Pertamina)">
              <input
                className="field-input"
                value={form.company_rep_name}
                onChange={e => setField('company_rep_name', e.target.value)}
                placeholder="Nama pejabat berwenang"
              />
            </FieldGroup>

            <FieldGroup label="Jabatan Pejabat Perusahaan">
              <input
                className="field-input"
                value={form.company_rep_title}
                onChange={e => setField('company_rep_title', e.target.value)}
                placeholder="Jabatan"
              />
            </FieldGroup>

            <FieldGroup label="Nama Kontraktor *">
              <input
                className="field-input"
                value={form.contractor_name}
                onChange={e => setField('contractor_name', e.target.value)}
                placeholder="Nama PT Kontraktor"
                required
              />
            </FieldGroup>

            <FieldGroup label="Pejabat Kontraktor">
              <input
                className="field-input"
                value={form.contractor_rep_name}
                onChange={e => setField('contractor_rep_name', e.target.value)}
                placeholder="Nama direktur / pejabat kontraktor"
              />
            </FieldGroup>
          </div>

          <hr className="form-section-divider" />

          {/* Section 2: Harga Kontrak (Lampiran C-I) */}
          <div className="form-section-title">
            <DollarSign size={16} /> 3. Harga Kontrak & Ketentuan Pembayaran (Lampiran C-I)
          </div>
          <div className="form-grid">
            <FieldGroup label="Nilai Pekerjaan Baru (Rp) *" hint={`Format: ${formatRupiah(form.nilai_pekerjaan_baru)} (belum PPN)`}>
              <input
                className="field-input"
                type="number"
                min="0"
                step="100000"
                value={form.nilai_pekerjaan_baru}
                onChange={e => setField('nilai_pekerjaan_baru', e.target.value)}
                required
              />
            </FieldGroup>

            <FieldGroup label="Tanggal Mulai Berlaku Amendemen">
              <input
                className="field-input"
                value={form.tanggal_berlaku_amendemen}
                onChange={e => setField('tanggal_berlaku_amendemen', e.target.value)}
                placeholder="cth. 04 September 2025"
              />
            </FieldGroup>
          </div>

          <hr className="form-section-divider" />

          {/* Section 3: Waktu Pelaksanaan (Lampiran D-II) */}
          <div className="form-section-title">
            <Clock size={16} /> 4. Jangka Waktu & Jadwal Pelaksanaan (Lampiran D-II)
          </div>
          <div className="form-grid">
            <FieldGroup label="Masa Penyelesaian Pekerjaan (MPP) Hari *">
              <input
                className="field-input"
                type="number"
                value={form.mpp_hari}
                onChange={e => setField('mpp_hari', e.target.value)}
                required
              />
            </FieldGroup>

            <FieldGroup label="Masa Penyelesaian Lingkup (MPL) Hari *">
              <input
                className="field-input"
                type="number"
                value={form.mpl_hari}
                onChange={e => setField('mpl_hari', e.target.value)}
                required
              />
            </FieldGroup>

            <FieldGroup label="Masa Penyelesaian Adm (MPA) Hari *">
              <input
                className="field-input"
                type="number"
                value={form.mpa_hari}
                onChange={e => setField('mpa_hari', e.target.value)}
                required
              />
            </FieldGroup>

            <FieldGroup label="Target Tanggal Selesai MPL">
              <input
                className="field-input"
                value={form.mpl_tanggal}
                onChange={e => setField('mpl_tanggal', e.target.value)}
                placeholder="cth. 01 April 2026"
              />
            </FieldGroup>

            <FieldGroup label="Target Tanggal Selesai MPA">
              <input
                className="field-input"
                value={form.mpa_tanggal}
                onChange={e => setField('mpa_tanggal', e.target.value)}
                placeholder="cth. 30 Juni 2026"
              />
            </FieldGroup>

            <FieldGroup label="Tanggal Akhir Jangka Waktu Kontrak">
              <input
                className="field-input"
                value={form.tanggal_akhir_kontrak}
                onChange={e => setField('tanggal_akhir_kontrak', e.target.value)}
                placeholder="cth. 25 Juni 2027"
              />
            </FieldGroup>
          </div>

          <div className="form-grid">
            <FieldGroup label="Nomor SP3MK">
              <input
                className="field-input"
                value={form.nomor_sp3mk}
                onChange={e => setField('nomor_sp3mk', e.target.value)}
                placeholder="SP3MK-007/PND900000/2024-S0"
              />
            </FieldGroup>
            <FieldGroup label="Tanggal SP3MK">
              <input
                className="field-input"
                value={form.tanggal_sp3mk}
                onChange={e => setField('tanggal_sp3mk', e.target.value)}
                placeholder="14 Maret 2024"
              />
            </FieldGroup>
          </div>

          <hr className="form-section-divider" />

          {/* Section 4: Dokumen Acuan & Lingkup (Lampiran G-II & B-I) */}
          <div className="form-section-title">
            <Calendar size={16} /> 5. Dokumen Pengadaan & Negosiasi (Lampiran G-II)
          </div>
          <FieldGroup
            label="Dasar Dokumen Perubahan (Satu per baris)"
            hint="Daftar surat penawaran kontraktor, notulen war room, risalah rapat pembahasan, dan berita acara klarifikasi/negosiasi."
          >
            <textarea
              className="field-input field-textarea"
              rows={4}
              value={form.dasar_dokumen_text}
              onChange={e => setField('dasar_dokumen_text', e.target.value)}
            />
          </FieldGroup>

          <button
            type="submit"
            className="primary-btn"
            disabled={generating || !form.project_name || !form.contract_ref}
            style={{ marginTop: 8 }}
          >
            {generating ? (
              <>
                <Loader2 size={16} className="spin" />
                Menyusun Dokumen & Lampiran Resmi…
              </>
            ) : (
              '🚀 Generate Dokumen Amandemen'
            )}
          </button>
        </form>
      )}

      {/* RESULT CARD */}
      {tab === 'generate' && result && (
        <div className="form-card result-card">
          <div className="result-icon"><CheckCircle size={40} /></div>
          <h2 className="result-title">Dokumen Amandemen Berhasil Disusun!</h2>
          <p className="result-filename">{result.filename}</p>
          <p className="result-message" style={{ margin: '0 auto 12px' }}>
            Paket amandemen kontrak lengkap telah digenerate sesuai standar format resmi Pertamina Patra Niaga.
          </p>

          <div className="annexes-card" style={{ margin: '0 auto 20px' }}>
            <div className="annexes-title">Lampiran Resmi Termasuk:</div>
            <ul className="annexes-list">
              {(result.annexes || [
                'Pokok-Pokok Kontrak (3 Halaman & Tabel Tanda Tangan)',
                'Lampiran B-I (Lingkup Pekerjaan Persiapan, Sipil, Mekanikal, Elektrikal, HSE)',
                'Lampiran C-I (Tabel Rekapitulasi Harga 15 Baris & Margin 8%)',
                `Lampiran D-II (Jadwal Pelaksanaan MPP, MPL, MPA & SP3MK)`,
                'Lampiran G-II (Dokumen Pengadaan & Berita Acara Negosiasi)',
                'Lembar Pembatas Resmi (LAMPIRAN AMENDEMEN)',
              ]).map((annex, idx) => (
                <li key={idx} className="annex-item">
                  <CheckCircle size={14} className="annex-icon" />
                  <span>{annex}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="result-actions">
            <a
              href={amendmentService.downloadUrl(result.filename)}
              download={result.filename}
              className="primary-btn"
            >
              <Download size={16} /> Unduh File DOCX
            </a>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setResult(null)}
            >
              Buat Amandemen Baru
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT / GUDANG AMANDEMEN */}
      {tab === 'history' && (
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="form-section-title">
              <History size={16} /> Gudang Dokumen Amandemen Tersimpan
            </div>
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={loadHistory}
              disabled={loadingHistory}
            >
              <RefreshCw size={13} className={loadingHistory ? 'spin' : ''} /> Segarkan
            </button>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              <p>Memuat riwayat dokumen amandemen…</p>
            </div>
          ) : historyList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
              <p>Belum ada dokumen amandemen yang tersimpan di sistem.</p>
              <button
                type="button"
                className="primary-btn"
                style={{ marginTop: 12 }}
                onClick={() => setTab('generate')}
              >
                Buat Dokumen Sekarang
              </button>
            </div>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Tingkat</th>
                    <th>Nama Pekerjaan</th>
                    <th>File Dokumen</th>
                    <th>Tanggal Dibuat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.amendment_level}</strong></td>
                      <td>{item.project_name}</td>
                      <td><code>{item.amendment_filename}</code></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td>
                        <a
                          href={amendmentService.downloadUrl(item.amendment_filename)}
                          download={item.amendment_filename}
                          className="secondary-btn"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                        >
                          <Download size={13} /> Unduh
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
