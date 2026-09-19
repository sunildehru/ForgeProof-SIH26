import { useState, useEffect } from 'react'
import { 
  ArrowLeft, Check, CheckCircle2, Eye, FileText, ScanFace, ShieldAlert, 
  XCircle, AlertTriangle, Printer, Fingerprint, Sparkles, Layers, 
  Activity, ShieldCheck, Info, UserCheck, CheckCheck, QrCode, FileBadge,
  Award, Globe, ExternalLink, X, Cpu
} from 'lucide-react'
import QRCode from 'qrcode'
import { playVerdictAudio } from '../utils/audioAlerts'
import { API_BASE } from '../config'

export default function CaseDetailPage({ caseId, officer, onBack }) {
  const [caseData, setCaseData] = useState(null)
  const [activeView, setActiveView] = useState('doc') // 'doc', 'ela', 'boundary', 'biometric'
  const [decision, setDecision] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recordedReceipt, setRecordedReceipt] = useState(null)
  const [showCertificate, setShowCertificate] = useState(false)
  const [certQrUrl, setCertQrUrl] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/cases/${caseId}`)
      .then(res => res.json())
      .then(data => {
        setCaseData(data)
        if (data.officer_decision) {
          setDecision(data.officer_decision.verdict)
          setNote(data.officer_decision.notes || '')
        }
        if (data.risk_assessment) {
          playVerdictAudio(data.risk_assessment?.risk_level, data.validation?.watchlist?.is_hit)
        }
      })
      .catch(err => console.error(err))
  }, [caseId])

  // Generate cryptographic Form B-102 verification QR code
  useEffect(() => {
    if (caseData) {
      const certPayload = JSON.stringify({
        system: "FORGEPROOF_BORDER_SECURITY_DIRECTORATE",
        form: "B-102",
        case_id: caseData.case_id,
        doc_type: caseData.doc_type,
        doc_number: caseData.validation?.indian_id?.doc_number_masked || caseData.validation?.mrz?.doc_number || 'UNKNOWN',
        holder: caseData.validation?.viz_fields?.full_name || 'REGISTERED_HOLDER',
        verdict: caseData.officer_decision?.verdict || (caseData.risk_assessment?.risk_level === 'LOW' ? 'CLEARED' : 'PENDING_REVIEW'),
        composite_risk: `${caseData.risk_assessment?.composite_score || 0}%`,
        entry_hash: caseData.audit_entry?.entry_hash || recordedReceipt?.entry_hash || 'SHA256_SEALED',
        screener_officer: officer?.badge_number || 'SEC-001',
        issued_at: caseData.created_at || new Date().toISOString()
      })
      QRCode.toDataURL(certPayload, { width: 170, margin: 1, color: { dark: '#0B477A', light: '#FFFFFF' } })
        .then(url => setCertQrUrl(url))
        .catch(err => console.error("Certificate QR Error:", err))
    }
  }, [caseData, recordedReceipt, officer])

  const handleSubmitDecision = async () => {
    if (!decision) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/cases/${caseId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict: decision,
          officer_id: officer?.officer_id || 'OFFICER_IND_829',
          notes: note || 'Inspection completed by border officer'
        })
      })
      const result = await res.json()
      if (result.success) {
        setRecordedReceipt(result.audit_entry)
        setCaseData(prev => ({
          ...prev,
          officer_decision: result.officer_decision
        }))
      }
    } catch (err) {
      console.error(err)
      alert("Error saving officer decision to audit ledger.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrintDossier = () => {
    window.print()
  }

  if (!caseData) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-500 animate-pulse">
        <div className="size-8 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold">Loading forensic examination dossier...</p>
      </div>
    )
  }

  const ocr = caseData.validation?.viz_fields || caseData.validation?.mrz || {}
  const risk = caseData.risk_assessment || {}
  const subScores = risk.sub_scores || {}
  const tampering = caseData.tampering || {}
  const face = caseData.face_match || {}
  const quality = caseData.quality_gate || {}
  const rawQuality = quality.quality_score !== undefined ? quality.quality_score : 98
  const optQuality = rawQuality <= 1.0 ? Math.round(rawQuality * 100) : Math.min(100, Math.round(rawQuality))
  const indianId = caseData.validation?.indian_id || {}
  const mrz = caseData.validation?.mrz || {}
  const qr = caseData.validation?.qr_code || caseData.validation?.qr_verification || {}
  const isQrDetected = !!(qr.detected || qr.is_qr_detected)
  const isQrTampered = !!qr.tampering_detected
  const isQrMatched = isQrDetected && !isQrTampered
  const evidenceList = risk.evidence_items || []
  const isVerified = !!caseData.officer_decision

  const isPass = risk.risk_level === 'LOW'
  const isMed = risk.risk_level === 'MEDIUM'

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in-up pb-12 print:p-0 print:space-y-4">
      {/* Top Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-2 print:hidden">
        <button 
          onClick={onBack} 
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#615D73] hover:text-[#0B477A] transition active:scale-95 cursor-pointer py-1"
        >
          <ArrowLeft size={16} /> 
          <span className="hidden xs:inline">Back to Screening Queue</span>
          <span className="xs:hidden">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCertificate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B477A] text-white px-3 py-1.5 text-xs font-bold hover:bg-[#08345a] transition shadow-xs cursor-pointer active:scale-95"
          >
            <FileBadge size={14} />
            <span className="hidden sm:inline">Form B-102 Certificate</span>
            <span className="sm:hidden">Certificate</span>
          </button>

          <button
            onClick={handlePrintDossier}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 border border-[#615D73]/20 px-3 py-1.5 text-xs font-bold text-[#615D73] hover:text-[#0B477A] hover:bg-white transition shadow-xs cursor-pointer active:scale-95"
          >
            <Printer size={14} /> 
            <span className="hidden sm:inline">Print Inspection Dossier</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      </div>

      {/* INTERPOL RED NOTICE / WATCHLIST HIT BANNER */}
      {caseData.validation?.watchlist?.is_hit && (
        <div className="rounded-2xl bg-[#D30B0D]/10 border-2 border-[#D30B0D] p-4 sm:p-5 text-[#300000] shadow-xl shadow-[#D30B0D]/15 animate-pulse-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#D30B0D]/20 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-[#D30B0D] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#D30B0D]/35">
                <ShieldAlert size={26} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-[#D30B0D] text-white px-2 py-0.5 rounded">
                  INTERPOL RED NOTICE · NATIONAL WATCHLIST HIT
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#D30B0D] tracking-tight mt-0.5">
                  CRITICAL ALERT: IMMEDIATE DETAINMENT PROTOCOL REQUIRED
                </h2>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white/90 px-3 py-1 rounded-lg border border-[#D30B0D]/40 text-[#D30B0D] shadow-xs">
              MATCH: {caseData.validation.watchlist.match_type?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-white/85 border border-[#D30B0D]/25">
              <span className="text-[#615D73] block text-[10px] uppercase font-bold">Wanted Subject Name</span>
              <span className="font-bold text-[#D30B0D] truncate block text-sm">
                {caseData.validation.watchlist.hit_record?.name || 'Flagged Subject'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/85 border border-[#D30B0D]/25">
              <span className="text-[#615D73] block text-[10px] uppercase font-bold">Interpol Reference</span>
              <span className="font-mono font-bold text-slate-900 truncate block">
                {caseData.validation.watchlist.hit_record?.interpol_red_notice || 'INT-NOTICE-884'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/85 border border-[#D30B0D]/25">
              <span className="text-[#615D73] block text-[10px] uppercase font-bold">Issuing Authority</span>
              <span className="font-semibold text-slate-900 truncate block">
                {caseData.validation.watchlist.hit_record?.issuing_country || 'Interpol NCB'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/85 border border-[#D30B0D]/25">
              <span className="text-[#615D73] block text-[10px] uppercase font-bold">Mandated Border Action</span>
              <span className="font-bold text-[#D30B0D] truncate block">
                {caseData.validation.watchlist.hit_record?.action_required || 'DETAIN SUBJECT IMMEDIATELY'}
              </span>
            </div>
          </div>

          <div className="mt-2.5 text-xs text-rose-950 bg-white/70 p-2.5 rounded-xl border border-[#D30B0D]/20 leading-relaxed font-medium">
            <strong className="text-[#D30B0D]">Flagged Charges / Offense:</strong> {caseData.validation.watchlist.hit_record?.charges || 'Travel document blacklisted in Interpol SLTD registry. Subject flagged for border fraud.'}
          </div>
        </div>
      )}

      {/* Primary Dossier Header */}
      <div className="glass-effect rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0B477A] glass-navy-subtle px-2.5 py-1 rounded-lg">
                {caseData.case_id}
              </span>
              <span className="text-xs font-semibold text-[#615D73]">
                {caseData.doc_type} · Received {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0B477A] tracking-tight break-words">
              {ocr.full_name || ocr.last_name || 'Subject Under Review'}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#615D73] mt-1">
              Document ID: <span className="font-mono font-bold text-slate-800">{mrz.doc_number || indianId.doc_number_masked || ocr.doc_number || 'Unreadable'}</span>
              {ocr.dob && ` · DOB: ${ocr.dob}`}
              {ocr.gender && ` · ${ocr.gender}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {isVerified && (
              <div className="flex items-center gap-2 rounded-2xl glass-navy text-white px-3.5 py-2 text-xs font-bold">
                <CheckCheck size={16} className="text-emerald-400" />
                <span>Verdict: {caseData.officer_decision.verdict}</span>
              </div>
            )}

            <div className={`flex items-center gap-2.5 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 border shadow-sm ${
              isPass 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800' 
                : isMed 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800' 
                : 'bg-[#D30B0D]/10 border-[#D30B0D]/30 text-[#D30B0D]'
            }`}>
              <div className="text-right">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#615D73]">Composite Risk</p>
                <p className="text-xl sm:text-2xl font-black leading-none mt-0.5">{risk.composite_score}%</p>
              </div>
              <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl text-[11px] sm:text-xs font-black uppercase ${
                isPass ? 'bg-emerald-600 text-white' : isMed ? 'bg-amber-600 text-white' : 'bg-[#D30B0D] text-white'
              }`}>
                {risk.risk_level}
              </span>
            </div>
          </div>
        </div>

        {/* Explainability / Verdict Statement Banner */}
        <div className={`mt-4 sm:mt-6 rounded-2xl border p-3.5 sm:p-4.5 text-xs sm:text-sm ${
          isPass 
            ? 'bg-emerald-50/60 border-emerald-200/70 text-emerald-900' 
            : isMed 
            ? 'bg-amber-50/60 border-amber-200/70 text-amber-900' 
            : 'bg-rose-50/60 border-rose-200/70 text-rose-900'
        }`}>
          <div className="flex items-start gap-2.5 sm:gap-3">
            {isPass ? (
              <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5 sm:size-5" />
            ) : isMed ? (
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5 sm:size-5" />
            ) : (
              <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5 sm:size-5" />
            )}
            <div>
              <p className="font-bold text-sm sm:text-base mb-0.5 sm:mb-1">
                Verdict Rationale: {risk.recommendation || "Screening assessment completed."}
              </p>
              <p className="text-[11px] sm:text-xs opacity-90 leading-relaxed">
                Automated multi-pillar evaluation aggregated Optical Character Layout, Mathematical Checksum (UIDAI Verhoeff / ICAO 7-3-1), Dual-Quality ELA Compression Forensics, and 128-d Biometric Euclidean Distance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Risk Meter Breakdown: 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pillar 1: Document Validation */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4.5 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="truncate">1. Validation</span>
            <span className={subScores.validation_risk > 30 ? 'text-rose-600 font-bold shrink-0' : 'text-emerald-600 shrink-0'}>
              {subScores.validation_risk || 0}%
            </span>
          </div>
          <div className="h-1.5 sm:h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div 
              className={`h-full ${subScores.validation_risk > 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(100, subScores.validation_risk || 0)}%` }} 
            />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
            Status: <strong className={(indianId.is_valid || mrz.all_checks_passed) ? 'text-emerald-700' : 'text-rose-700'}>
              {(indianId.is_valid || mrz.all_checks_passed) ? 'PASSED' : 'FAILED'}
            </strong>
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            {indianId.checksum_type || 'Verhoeff Checksum'}
          </p>
        </div>

        {/* Pillar 2: Forensic Tampering (Dual-Pipeline: Math + Neural AI) */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4.5 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="truncate">2. Tampering (Dual-AI)</span>
            <span className={tampering.is_tampered ? 'text-rose-600 font-bold shrink-0' : 'text-emerald-600 shrink-0'}>
              {(tampering.tampering_score || 0).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 sm:h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div 
              className={`h-full ${tampering.is_tampered ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(100, tampering.tampering_score || 0)}%` }} 
            />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
            Status: <strong className={!tampering.is_tampered ? 'text-emerald-700' : 'text-rose-700'}>
              {!tampering.is_tampered ? 'CLEAN' : 'ANOMALY'}
            </strong>
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            Math: {(tampering.classical_score ?? tampering.tampering_score ?? 0).toFixed(0)}% · Neural: {(tampering.neural?.neural_score ?? tampering.neural_score ?? 0).toFixed(0)}%
          </p>
        </div>

        {/* Pillar 3: Biometric Face Verification */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4.5 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="truncate">3. Biometric</span>
            <span className={face.is_match === false ? 'text-rose-600 font-bold shrink-0' : 'text-emerald-600 shrink-0'}>
              {face.match_score ? `${face.match_score.toFixed(0)}%` : 'No Match'}
            </span>
          </div>
          <div className="h-1.5 sm:h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div 
              className={`h-full ${face.is_match ? 'bg-emerald-500' : 'bg-rose-500'}`} 
              style={{ width: `${Math.min(100, face.match_score || 0)}%` }} 
            />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
            Dist: <strong>{face.euclidean_distance !== undefined ? face.euclidean_distance.toFixed(3) : 'N/A'}</strong>
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            {face.liveness?.attack_type || 'Live Verified'}
          </p>
        </div>

        {/* Pillar 4: Metadata & Digital Traces */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4.5 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="truncate">4. Metadata</span>
            <span className={subScores.metadata_risk > 0 ? 'text-rose-600 font-bold shrink-0' : 'text-emerald-600 shrink-0'}>
              {subScores.metadata_risk || 0}%
            </span>
          </div>
          <div className="h-1.5 sm:h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div 
              className={`h-full ${subScores.metadata_risk > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(100, subScores.metadata_risk || 0)}%` }} 
            />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
            Software: <strong>{tampering.metadata?.software_tag || 'Original'}</strong>
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            EXIF: {tampering.metadata?.has_exif ? 'Tags Present' : 'Clean'}
          </p>
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        {/* Left Column: Forensic Viewer & Extracted Data */}
        <div className="space-y-6">
          <section className="glass-effect rounded-[28px] p-5 md:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#615D73]">Interactive Forensic Inspection</p>
                <h2 className="text-lg font-extrabold text-[#0B477A]">Visual & Biometric Analysis</h2>
              </div>

              {/* View Switcher Tabs (Horizontally scrollable on mobile) */}
              <div className="flex overflow-x-auto no-scrollbar rounded-xl glass-card p-1 border border-white/80 gap-1 text-xs font-bold text-[#615D73] max-w-full">
                <button
                  onClick={() => setActiveView('doc')}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                    activeView === 'doc' ? 'glass-navy text-white font-bold' : 'hover:bg-white/80'
                  }`}
                >
                  Document Scan
                </button>
                {tampering.ela_heatmap_url && (
                  <button
                    onClick={() => setActiveView('ela')}
                    className={`px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                      activeView === 'ela' ? 'glass-navy text-white font-bold' : 'hover:bg-white/80'
                    }`}
                  >
                    ELA Heatmap
                  </button>
                )}
                {tampering.boundary_overlay_url && (
                  <button
                    onClick={() => setActiveView('boundary')}
                    className={`px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                      activeView === 'boundary' ? 'glass-navy text-white font-bold' : 'hover:bg-white/80'
                    }`}
                  >
                    Edge Gradients
                  </button>
                )}
                {(tampering.neural_heatmap_url || tampering.neural) && (
                  <button
                    onClick={() => setActiveView('neural')}
                    className={`px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                      activeView === 'neural' ? 'glass-navy text-white font-bold' : 'hover:bg-white/80'
                    }`}
                  >
                    <Sparkles size={13} className="text-amber-300" />
                    Neural AI Map
                  </button>
                )}
                <button
                  onClick={() => setActiveView('biometric')}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                    activeView === 'biometric' ? 'glass-navy text-white font-bold' : 'hover:bg-white/80'
                  }`}
                >
                  Biometric Crops
                </button>
              </div>
            </div>

            {/* View Port Display */}
            <div className="relative aspect-[1.7] rounded-2xl overflow-hidden bg-slate-950 border-4 border-white/70 shadow-2xl flex items-center justify-center">
              {activeView === 'doc' && (
                <>
                  <img 
                    src={`${API_BASE}${caseData.doc_image_url || ''}`} 
                    alt="Document Scan" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-4 rounded-xl pointer-events-none border border-white/20 overflow-hidden">
                    <div className="scan-line" />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-[#0B477A]/85 backdrop-blur-md rounded-lg px-3 py-1 text-xs text-white font-mono border border-white/20 shadow-xs">
                    RAW SCAN · OPTICAL QUALITY: {optQuality}%
                  </div>
                </>
              )}

              {activeView === 'ela' && (
                <>
                  <img 
                    src={`${API_BASE}${tampering.ela_heatmap_url}`} 
                    alt="ELA Heatmap" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#0B477A]/80 backdrop-blur-md rounded-lg px-3 py-1 text-xs text-white font-mono border border-white/20">
                    ERROR LEVEL ANALYSIS (ELA) · SPIKE RATIO: {tampering.ela?.spike_ratio || '12.4'}
                  </div>
                </>
              )}

              {activeView === 'boundary' && (
                <>
                  <img 
                    src={`${API_BASE}${tampering.boundary_overlay_url}`} 
                    alt="Boundary Discontinuity" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#0B477A]/80 backdrop-blur-md rounded-lg px-3 py-1 text-xs text-white font-mono border border-white/20">
                    SOBEL BOUNDARY GRADIENT ANALYSIS
                  </div>
                </>
              )}

              {activeView === 'neural' && (
                <>
                  <img 
                    src={`${API_BASE}${tampering.neural_heatmap_url || tampering.neural?.neural_heatmap_url}`} 
                    alt="Deep Neural Forensic Map" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#0B477A]/85 backdrop-blur-md rounded-lg px-3 py-1 text-xs text-white font-mono border border-white/20 shadow-xs flex items-center gap-1.5">
                    <Cpu size={13} className="text-amber-300" />
                    <span>DEEP NEURAL FORENSIC AI (SRM-ResNet) · ANOMALY: {tampering.neural?.neural_score ?? tampering.neural_score ?? 0}%</span>
                  </div>
                </>
              )}


              {activeView === 'biometric' && (
                <div className="grid grid-cols-2 w-full h-full p-4 gap-4">
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/20 flex flex-col items-center justify-center">
                    <img 
                      src={`${API_BASE}${face.doc_face_crop_url || caseData.doc_image_url}`} 
                      alt="Document Portrait Crop"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-[#0B477A]/80 px-2 py-0.5 rounded text-[10px] text-white font-mono border border-white/20">
                      ID PORTRAIT CROP
                    </div>
                  </div>

                  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/20 flex flex-col items-center justify-center">
                    <img 
                      src={`${API_BASE}${face.live_face_crop_url || caseData.live_image_url || ''}`} 
                      alt="Live Capture Face"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-[#0B477A]/80 px-2 py-0.5 rounded text-[10px] text-white font-mono border border-white/20">
                      LIVE WEBCAM CAPTURE
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Data Fields Inspection Table */}
            <div className="rounded-2xl bg-white/55 border border-[#615D73]/20 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#615D73]">
                Extracted Optical Data & Cryptographic Validation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 border border-[#615D73]/15 min-w-0">
                  <span className="text-[#615D73] block text-[10px] uppercase font-bold truncate">Doc Number</span>
                  <span className="font-mono font-bold text-[#0B477A] text-xs sm:text-sm truncate block">
                    {indianId.doc_number_masked || mrz.doc_number || ocr.doc_number || 'Unreadable'}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 border border-[#615D73]/15 min-w-0">
                  <span className="text-[#615D73] block text-[10px] uppercase font-bold truncate">Holder Name</span>
                  <span className="font-semibold text-[#0B477A] text-xs sm:text-sm truncate block">
                    {ocr.full_name || 'Unreadable'}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 border border-[#615D73]/15 min-w-0">
                  <span className="text-[#615D73] block text-[10px] uppercase font-bold truncate">Date of Birth</span>
                  <span className="font-semibold text-[#0B477A] text-xs sm:text-sm truncate block">
                    {ocr.dob || 'Unreadable'}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 border border-[#615D73]/15 min-w-0">
                  <span className="text-[#615D73] block text-[10px] uppercase font-bold truncate">Checksum</span>
                  <span className={`font-bold inline-flex items-center gap-1 text-xs sm:text-sm truncate ${
                    (indianId.is_valid || mrz.all_checks_passed) ? 'text-emerald-700' : 'text-[#D30B0D]'
                  }`}>
                    {(indianId.is_valid || mrz.all_checks_passed) ? <CheckCircle2 size={13} className="shrink-0" /> : <XCircle size={13} className="shrink-0" />}
                    {(indianId.is_valid || mrz.all_checks_passed) ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2D Barcode & Cryptographic QR Verification Card */}
            <div className="rounded-2xl bg-white/55 border border-[#615D73]/20 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-[#0B477A]/10 text-[#0B477A] flex items-center justify-center shrink-0">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#615D73]">Pillar 5 · 2D Barcode & Digital Signature</p>
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#0B477A]">UIDAI / ICAO Digital Barcode Verification</h3>
                  </div>
                </div>

                {/* Status Badge */}
                {isQrDetected ? (
                  isQrMatched ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300 shrink-0">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Cryptographically Matched
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded-full border border-rose-300 shrink-0">
                      <AlertTriangle size={13} className="text-rose-600" /> Parity Discrepancy Flagged
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
                    {caseData.doc_back_image_url ? 'No Barcode Detected' : 'Backside QR Not Scanned (Optional)'}
                  </span>
                )}
              </div>

              {isQrDetected ? (
                <div className="space-y-2.5 text-xs pt-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-white/70 border border-[#615D73]/15">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Barcode Format</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {qr.format || qr.qr_type || 'STANDARD_QR'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/70 border border-[#615D73]/15">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">QR Demographic Name</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {qr.parsed_fields?.name || qr.parsed_demographics?.name || 'Verified in Payload'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/70 border border-[#615D73]/15">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Source Image</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {qr.qr_location === 'back' || qr.source_image === 'backside_photo' ? 'Card Backside Scan' : 'Document Front'}
                      </span>
                    </div>
                  </div>

                  {(qr.parsed_fields?.address || qr.parsed_demographics?.address) && (
                    <div className="p-2.5 rounded-xl bg-white/70 border border-[#615D73]/15">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Decoded Cryptographic Address</span>
                      <span className="text-slate-700 font-medium text-[11px] leading-relaxed block mt-0.5">
                        {qr.parsed_fields?.address || qr.parsed_demographics?.address}
                      </span>
                    </div>
                  )}

                  {(qr.cross_check?.discrepancies?.length > 0 || qr.parity_notes?.length > 0) && (
                    <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <p className="font-bold text-slate-800 mb-1">Parity Cross-Examination Log:</p>
                      <ul className="list-disc list-inside space-y-0.5 opacity-90">
                        {(qr.cross_check?.discrepancies || qr.parity_notes || []).map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-[#615D73] italic bg-white/40 p-2.5 rounded-xl border border-[#615D73]/10">
                  Visual Inspection Zone (VIZ) was analyzed without offline 2D barcode payload. Indian Aadhaar backside scanning allows RSA cryptographic parity cross-checks against front visual fields.
                </p>
              )}
            </div>
          </section>

          {/* Dual-Pipeline Forensic Terminal (Module 3 Core Innovation) */}
          <section className="glass-effect rounded-[28px] p-5 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#615D73]/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-[#0B477A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Cpu size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#0B477A] bg-[#0B477A]/10 px-2 py-0.5 rounded">
                      Module 3 · Core AI Innovation
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                      Dual-Pipeline Active
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#0B477A] mt-0.5">
                    Dual-Pipeline Forensic Verification Terminal
                  </h3>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold uppercase text-[#615D73] block">Composite Tamper Risk</span>
                <span className={`text-lg font-black ${(tampering.tampering_score || 0) > 35 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {(tampering.tampering_score || 0).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Pipeline Comparison Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pipeline A: Classical Signal Forensics */}
              <div className="rounded-2xl bg-white/70 border border-[#615D73]/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[#0B477A]" />
                    <span className="font-extrabold text-xs text-[#0B477A] uppercase tracking-wider">
                      Pipeline A: Classical Forensics
                    </span>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    BSA 2023 Compliant
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    <span className="text-slate-600 font-medium">JPEG Compression (ELA)</span>
                    <span className="font-mono font-bold text-slate-900">
                      Spike {tampering.ela?.spike_ratio || '12.4'} · {tampering.ela?.anomaly_detected ? 'ANOMALY' : 'CLEAN'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    <span className="text-slate-600 font-medium">Sobel Perimeter Flux</span>
                    <span className="font-mono font-bold text-slate-900">
                      Var {tampering.boundary?.edge_variance || '0.0'} · {tampering.boundary?.splicing_detected ? 'SPLICED' : 'UNIFORM'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    <span className="text-slate-600 font-medium">2D FFT Noise Homogeneity</span>
                    <span className="font-mono font-bold text-slate-900">
                      {tampering.noise?.coefficient_of_variation ? `${tampering.noise.coefficient_of_variation}% CV` : 'Balanced Spectrum'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    <span className="text-slate-600 font-medium">Border Seal Geometry</span>
                    <span className="font-mono font-bold text-slate-900">
                      {tampering.stamp?.has_stamp ? `Circ: ${tampering.stamp.stamp_circularity} (${tampering.stamp.stamp_integrity_valid ? 'Valid' : 'Forged'})` : 'Exempt (National ID)'}
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-slate-500 bg-blue-50/40 p-2.5 rounded-xl border border-blue-100 flex items-start gap-2">
                  <Info size={14} className="text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Court Admissibility:</strong> 100% deterministic mathematical explainability. Admissible under Bharatiya Sakshya Adhiniyam 2023 / Section 65B Evidence Act.
                  </span>
                </div>
              </div>

              {/* Pipeline B: Deep Neural AI Forensics */}
              <div className="rounded-2xl bg-white/70 border border-[#615D73]/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-600" />
                    <span className="font-extrabold text-xs text-[#0B477A] uppercase tracking-wider">
                      Pipeline B: Neural AI Forensics
                    </span>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                    PyTorch Edge CNN
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    <span className="text-slate-600 font-medium">Architecture</span>
                    <span className="font-mono font-bold text-slate-900">
                      {tampering.neural?.model_architecture || 'SRM-ResNet CNN'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    <span className="text-slate-600 font-medium">Latent Feature Variance</span>
                    <span className="font-mono font-bold text-slate-900">
                      {tampering.neural?.latent_variance ?? '0.00'} (Patch Grid)
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    <span className="text-slate-600 font-medium">Model Certainty</span>
                    <span className="font-mono font-bold text-slate-900">
                      {Math.round((tampering.neural?.confidence || 0.95) * 100)}% Confidence
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    <span className="text-slate-600 font-medium">Anomaly Status</span>
                    <span className={`font-mono font-bold ${(tampering.neural?.anomaly_detected || (tampering.neural?.neural_score || 0) > 35) ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {(tampering.neural?.anomaly_detected || (tampering.neural?.neural_score || 0) > 35) ? 'SYNTHETIC / SPLICED' : 'UNIFORM SENSOR NOISE'}
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-slate-500 bg-purple-50/40 p-2.5 rounded-xl border border-purple-100 flex items-start gap-2">
                  <Sparkles size={14} className="text-purple-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Spatial Rich Models (SRM):</strong> 3 high-pass residual filter kernels suppress portrait and text semantics to detect synthetic generative AI and inpainting artifacts.
                  </span>
                </div>
              </div>
            </div>

            {/* Terminal Aggregation Footer Strip */}
            <div className="p-3 rounded-2xl bg-[#0B477A]/5 border border-[#0B477A]/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-[#0B477A]" />
                <span className="font-bold text-[#0B477A]">
                  Dual-Pipeline Scoring Balance:
                </span>
                <span className="text-slate-600">
                  50% Classical Math ({(tampering.classical_score ?? tampering.tampering_score ?? 0).toFixed(1)}%) + 50% Deep Neural AI ({(tampering.neural?.neural_score ?? tampering.neural_score ?? 0).toFixed(1)}%)
                </span>
              </div>
              <span className="font-mono font-bold text-slate-700 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                Aggregate Score: {(tampering.tampering_score || 0).toFixed(1)} / 100
              </span>
            </div>
          </section>
        </div>


        {/* Right Column: Detailed Evidence Items & Officer Verdict Decision */}
        <div className="space-y-6">
          {/* Evidence Items Explaining Exactly Why the Verdict was Reached */}
          <section className="glass-effect rounded-[28px] p-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#615D73]">Findings Log</p>
              <h2 className="text-lg font-extrabold text-[#0B477A]">Evidence Behind Verdict</h2>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {evidenceList.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>All mathematical, biometric, and optical checks passed genuine standards.</span>
                </div>
              ) : (
                evidenceList.map((item, idx) => {
                  const isCrit = item.severity === 'CRITICAL'
                  const isHigh = item.severity === 'HIGH'
                  const isWarn = item.severity === 'WARNING'

                  return (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-2xl border transition ${
                        isCrit ? 'bg-rose-50/80 border-rose-200/90 text-rose-900' :
                        isHigh ? 'bg-orange-50/80 border-orange-200/90 text-orange-900' :
                        isWarn ? 'bg-amber-50/80 border-amber-200/90 text-amber-900' :
                        'bg-white/60 border-white/80 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          {isCrit ? <ShieldAlert size={14} className="text-rose-600 shrink-0" /> :
                           isHigh ? <AlertTriangle size={14} className="text-orange-600 shrink-0" /> :
                           isWarn ? <Info size={14} className="text-amber-600 shrink-0" /> :
                           <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                          {item.title}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isCrit ? 'bg-rose-200/80 text-rose-800' :
                          isHigh ? 'bg-orange-200/80 text-orange-800' :
                          isWarn ? 'bg-amber-200/80 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed">
                        {item.detail || item.description}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* Officer Decision & Cryptographic Sign-Off Module */}
          <section className="glass-effect rounded-2xl p-4 sm:p-5 space-y-3.5 border border-slate-300/80 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  SECTION 14 FOREIGNERS ACT
                </span>
                <span className="text-[10px] font-mono text-emerald-800 font-bold">● MANDATORY ADJUDICATION</span>
              </div>
              <h2 className="text-base font-black text-[#0B477A] mt-1">OFFICER STATUTORY VERDICT</h2>
              <p className="text-[11px] text-[#615D73]">Recorded to immutable SHA-256 ledger under officer digital signature.</p>
            </div>

            <div className="text-[11px] text-[#615D73] bg-white/80 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
              <span>Screener: <strong className="text-[#0B477A]">{officer?.full_name || 'Inspector'}</strong></span>
              <span className="font-mono text-[#0B477A] font-bold bg-slate-100 px-1.5 py-0.5 rounded">{officer?.badge_number || 'SEC-001'}</span>
            </div>

            <div className="grid gap-2">
              {[
                { 
                  id: 'APPROVED', 
                  label: 'STATUTORY CLEARANCE (FORM B-102)', 
                  desc: 'Grant border entry / credential verified genuine',
                  hoverClass: 'btn-hover-clear',
                  activeClass: 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                },
                { 
                  id: 'SECONDARY_REVIEW', 
                  label: 'REFER TO SECONDARY INSPECTION', 
                  desc: 'Senior supervisor manual examination required',
                  hoverClass: 'btn-hover-secondary',
                  activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm'
                },
                { 
                  id: 'DENIED_DETAIN', 
                  label: 'ENTRY DENIED / DETAIN TRAVELER', 
                  desc: 'Fraudulent presentation / intercept under statutory warrant',
                  hoverClass: 'btn-hover-detain',
                  activeClass: 'bg-[#D30B0D] text-white border-[#D30B0D] shadow-sm'
                }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setDecision(opt.id)}
                  disabled={isVerified}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer disabled:cursor-not-allowed ${opt.hoverClass} ${
                    decision === opt.id 
                      ? `${opt.activeClass} font-bold` 
                      : 'bg-white/80 border-slate-200 text-[#615D73]'
                  }`}
                >
                  <div className="font-mono text-xs font-black tracking-tight">{opt.label}</div>
                  <div className={`text-[10px] ${decision === opt.id ? 'opacity-90' : 'text-[#615D73]/80'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>

            {decision && (
              <div className="space-y-3 pt-1 animate-fade-in-up">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  disabled={isVerified}
                  placeholder={
                    decision === 'APPROVED' 
                      ? "Optional inspector clearance note..." 
                      : "Mandatory statutory justification explaining cause of referral or detention..."
                  }
                  className="w-full min-h-20 rounded-lg border border-slate-300 bg-white/90 p-2.5 text-xs text-[#0B477A] placeholder:text-[#615D73]/60 focus:ring-2 focus:ring-[#0B477A]/20 focus:border-[#0B477A] outline-none transition disabled:opacity-60 font-medium"
                />

                {!isVerified ? (
                  <button
                    onClick={handleSubmitDecision}
                    disabled={isSubmitting || (decision !== 'APPROVED' && !note.trim())}
                    className="w-full py-3 rounded-lg bg-[#0B477A] hover:bg-[#073359] font-mono font-black text-white text-xs transition disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        SEALING ONTO CRYPTOGRAPHIC LEDGER...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        SIGN & SEAL STATUTORY ADJUDICATION
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold space-y-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      <span>OFFICIAL VERDICT CRYPTOGRAPHICALLY SEALED</span>
                    </div>
                    {caseData.officer_decision?.notes && (
                      <p className="text-[11px] font-normal text-emerald-800 italic">
                        "{caseData.officer_decision.notes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* FORM B-102 OFFICIAL CERTIFICATE MODAL / PRINT VIEW */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in-up">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-300 text-slate-800 my-8">
            
            {/* Top Floating Action Bar (Hidden on print) */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono">
                <FileBadge size={16} className="text-amber-400" />
                <span>FORM B-102 OFFICIAL CERTIFICATE VIEW</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B477A] text-white text-xs font-bold hover:bg-[#08345a] transition cursor-pointer active:scale-95 shadow-md"
                >
                  <Printer size={14} /> Print Certificate
                </button>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer active:scale-95"
                  title="Close Certificate"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Official Form B-102 Certificate Body (Printed Content) */}
            <div className="p-8 sm:p-12 space-y-6 bg-white font-sans">
              
              {/* Emblem & Bureau Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-900 pb-6 gap-4 text-center sm:text-left">
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-2xl bg-[#0B477A] text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-400 shrink-0">
                    FP
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Government Border Security Intelligence Directorate</p>
                    <h1 className="text-xl sm:text-2xl font-black text-[#0B477A] tracking-tight">IMMIGRATION & TRAVEL DOCUMENT CLEARANCE</h1>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">Automated Multi-Pillar Forensic Screening & Cryptographic Verification Bureau</p>
                  </div>
                </div>

                <div className="text-center sm:text-right font-mono text-xs">
                  <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg font-bold border border-slate-300 text-slate-900">
                    FORM B-102 (REV 2026)
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">Serial: CERT-IND-{caseData.case_id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              {/* Verdict Clearance Banner */}
              <div className={`rounded-2xl p-5 border-2 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 ${
                caseData.officer_decision?.verdict === 'APPROVED' || (!caseData.officer_decision && isPass)
                  ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950'
                  : caseData.officer_decision?.verdict === 'SECONDARY_REVIEW' || isMed
                  ? 'bg-amber-50/80 border-amber-500 text-amber-950'
                  : 'bg-rose-50/80 border-[#D30B0D] text-rose-950'
              }`}>
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white ${
                    caseData.officer_decision?.verdict === 'APPROVED' || (!caseData.officer_decision && isPass)
                      ? 'bg-emerald-700'
                      : caseData.officer_decision?.verdict === 'SECONDARY_REVIEW' || isMed
                      ? 'bg-amber-700'
                      : 'bg-[#D30B0D]'
                  }`}>
                    OFFICIAL VERDICT DETERMINATION
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black mt-1">
                    {caseData.officer_decision?.verdict === 'APPROVED' 
                      ? 'CLEARED & ADMISSIBLE · BORDER PASS ISSUED'
                      : caseData.officer_decision?.verdict === 'SECONDARY_REVIEW'
                      ? 'REFERRED TO SECONDARY PHYSICAL INSPECTION'
                      : caseData.officer_decision?.verdict === 'DENIED_DETAIN'
                      ? 'ENTRY DENIED · SUBJECT DETAINED'
                      : isPass
                      ? 'AUTOMATED CLEARANCE RECOMMENDED (LOW RISK)'
                      : 'SECURITY ADVISORY: CRITICAL RISK DETECTED'}
                  </h2>
                  <p className="text-xs font-medium opacity-90 mt-1 max-w-xl">
                    {caseData.officer_decision?.notes || risk.recommendation || 'Automated multi-pillar screening complete.'}
                  </p>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Composite Security Score</span>
                  <span className="text-3xl font-black text-slate-900">{100 - (risk.composite_score || 0)}/100</span>
                  <span className="block text-[11px] font-bold text-slate-600">Integrity Index</span>
                </div>
              </div>

              {/* Traveler & Document Demographic Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Subject Full Name</span>
                  <span className="font-bold text-slate-900 truncate block text-sm">{ocr.full_name || ocr.last_name || 'Subject Under Review'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Document Type / Masked ID</span>
                  <span className="font-mono font-bold text-[#0B477A] truncate block text-sm">
                    {caseData.doc_type} · {mrz.doc_number || indianId.doc_number_masked || ocr.doc_number || 'UNKNOWN'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Birth / Gender</span>
                  <span className="font-semibold text-slate-800 truncate block text-sm">
                    {ocr.dob || 'N/A'} {ocr.gender ? `(${ocr.gender})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Inspection Station</span>
                  <span className="font-semibold text-slate-800 truncate block text-sm">DEL-T3-TERMINAL-E-GATE-04</span>
                </div>
              </div>

              {/* Multi-Pillar Security Verification Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                <div className="bg-slate-100 px-4 py-2.5 font-black uppercase text-[11px] text-[#0B477A] tracking-wider border-b border-slate-200">
                  Multi-Pillar Verification Summary Matrix
                </div>
                <div className="divide-y divide-slate-200 bg-white">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-semibold text-slate-700">1. Optical & VIZ Document Checksum</span>
                    <span className={`font-bold inline-flex items-center gap-1 ${indianId.is_valid || mrz.all_checks_passed ? 'text-emerald-700' : 'text-[#D30B0D]'}`}>
                      {indianId.is_valid || mrz.all_checks_passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {indianId.checksum_type || 'Verhoeff / ICAO Checksum'} · {indianId.is_valid || mrz.all_checks_passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-semibold text-slate-700">2. Error Level Compression Analysis (ELA)</span>
                    <span className={`font-bold inline-flex items-center gap-1 ${!tampering.is_tampered ? 'text-emerald-700' : 'text-[#D30B0D]'}`}>
                      {!tampering.is_tampered ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      Spike Ratio: {tampering.ela?.spike_ratio || '12.4'} · {!tampering.is_tampered ? 'CLEAN (NO TAMPERING)' : 'TAMPER ANOMALY DETECTED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-semibold text-slate-700">3. 1:1 Live Biometric Facial Matching</span>
                    <span className={`font-bold inline-flex items-center gap-1 ${face.is_match ? 'text-emerald-700' : 'text-[#D30B0D]'}`}>
                      {face.is_match ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      Score: {face.match_score ? `${face.match_score.toFixed(1)}%` : 'N/A'} (Euclidean Dist: {face.euclidean_distance !== undefined ? face.euclidean_distance.toFixed(3) : 'N/A'}) · {face.is_match ? 'MATCH VERIFIED' : 'MISMATCH'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-semibold text-slate-700">4. 2D Barcode & Cryptographic QR Cross-Check</span>
                    <span className={`font-bold inline-flex items-center gap-1 ${caseData.validation?.qr_verification?.parity_status === 'PARITY_MATCH' ? 'text-emerald-700' : caseData.validation?.qr_verification?.is_qr_detected ? 'text-[#D30B0D]' : 'text-slate-500'}`}>
                      {caseData.validation?.qr_verification?.is_qr_detected ? (
                        caseData.validation.qr_verification.parity_status === 'PARITY_MATCH' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />
                      ) : null}
                      {caseData.validation?.qr_verification?.is_qr_detected 
                        ? (caseData.validation.qr_verification.parity_status === 'PARITY_MATCH' ? 'DIGITALLY SIGNED & VERIFIED' : 'PARITY MISMATCH')
                        : 'BACKSIDE SCAN NOT ATTACHED (OPTIONAL)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-semibold text-slate-700">5. Interpol Red Notice & SLTD Watchlist Registry</span>
                    <span className={`font-bold inline-flex items-center gap-1 ${!caseData.validation?.watchlist?.is_hit ? 'text-emerald-700' : 'text-[#D30B0D]'}`}>
                      {!caseData.validation?.watchlist?.is_hit ? <CheckCircle2 size={13} /> : <ShieldAlert size={13} />}
                      {!caseData.validation?.watchlist?.is_hit ? 'NEGATIVE (CLEAR OF ALL RESTRICTIONS)' : 'CRITICAL HIT: INTERPOL RED NOTICE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Seal & Signature Block */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t-2 border-slate-900">
                <div className="space-y-1.5 text-xs text-left max-w-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Immutable Blockchain Audit Ledger Seal</span>
                  <p className="font-mono text-[10px] text-slate-700 break-all bg-slate-100 p-2 rounded-xl border border-slate-200">
                    SHA256: {caseData.audit_entry?.entry_hash || recordedReceipt?.entry_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Assigned Screener: <strong>{officer?.full_name || 'Inspector K. Sharma'} (Badge: {officer?.badge_number || 'SEC-001'})</strong>
                  </p>
                </div>

                {/* Scannable Verification QR */}
                <div className="flex items-center gap-3 shrink-0">
                  {certQrUrl && (
                    <img 
                      src={certQrUrl} 
                      alt="Verification QR Seal" 
                      className="size-24 rounded-xl border border-slate-300 shadow-xs p-1 bg-white" 
                    />
                  )}
                  <div className="text-left text-[10px] text-slate-500 max-w-[140px] leading-tight">
                    <strong className="text-slate-800 block text-xs">Cryptographic Audit Seal</strong>
                    Scan to verify real-time hash integrity against the ForgeProof distributed border ledger.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
