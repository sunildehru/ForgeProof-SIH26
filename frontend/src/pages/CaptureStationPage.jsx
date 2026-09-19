import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Camera, Upload, CheckCircle2, FileText, ScanFace, Activity, ShieldAlert, SwitchCamera, QrCode, Zap, X, Play, Sparkles } from 'lucide-react'
import { API_BASE } from '../config'

const docTypes = [
  { id: 'PASSPORT', label: 'Passport (ICAO Doc 9303)', desc: 'International Machine Readable Travel Document (TD1/TD2/TD3)' },
  { id: 'AADHAAR', label: 'Aadhaar Card (UIDAI)', desc: '12-Digit Demographic & Cryptographic Secure QR Card' },
  { id: 'PAN', label: 'Permanent Account Number (PAN)', desc: 'Income Tax Department Taxpayer Identity Card' },
  { id: 'DRIVING_LICENSE', label: 'Driving Licence (MoRTH)', desc: 'State Motor Vehicle Operator Permit' },
  { id: 'VOTER_ID', label: 'Voter Identity Card (ECI)', desc: 'Election Commission of India Electoral Photo ID (EPIC)' }
]

const CALIBRATION_PRESETS = [
  {
    id: 'deck_authentic',
    backendPresetId: 'scenario1_genuine_passport',
    tag: 'AUTHENTIC CLEARANCE',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    title: 'Genuine Indian Passport (ICAO Doc 9303)',
    subtitle: 'Standard admissible presentation with 1:1 facial match',
    docType: 'PASSPORT',
    docFile: 'scenario1_genuine_indian_passport.jpg',
    faceFile: 'presenter_rohit_matching.jpg',
    summary: 'Full MRZ checksum integrity, uniform ELA compression curve, 96.4% biometric face match.',
    expected: 'LOW RISK · ADMISSIBLE'
  },
  {
    id: 'deck_photo_splice',
    backendPresetId: 'scenario2_photo_splice',
    tag: 'PHOTO SPLICE FORGERY',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    title: 'Tampered Passport · Photo Splice Overlay',
    subtitle: 'Physical visual alteration and portrait substitution',
    docType: 'PASSPORT',
    docFile: 'scenario2_tampered_photo_splice.jpg',
    faceFile: 'presenter_impersonator_mismatch.jpg',
    summary: 'High-frequency ELA noise around portrait frame, biometric mismatch against presenter.',
    expected: 'HIGH RISK · ANOMALY FLOOR TRIGGERED'
  },
  {
    id: 'deck_date_fraud',
    backendPresetId: 'scenario3_date_fraud',
    tag: 'MRZ CHECKSUM MISMATCH',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    title: 'Tampered Passport · Date Fraud & MRZ Desync',
    subtitle: 'Printed expiry modified to 2036 vs encoded 2031 in MRZ',
    docType: 'PASSPORT',
    docFile: 'scenario3_tampered_date_mrz_mismatch.jpg',
    faceFile: 'presenter_rohit_matching.jpg',
    summary: 'Printed expiry modified; MRZ check digit fails mathematical 7-3-1 verification.',
    expected: 'HIGH RISK · CHECKSUM DISCREPANCY'
  },
  {
    id: 'deck_genuine_aadhaar',
    backendPresetId: 'scenario4_genuine_aadhaar',
    tag: 'UIDAI VERHOEFF PASS',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    title: 'Genuine Indian Aadhaar Card (UIDAI)',
    subtitle: 'UIDAI official Verhoeff D5 checksum verified standard',
    docType: 'AADHAAR',
    docFile: 'scenario4_genuine_indian_aadhaar.jpg',
    faceFile: 'presenter_rohit_matching.jpg',
    summary: 'Valid 12-digit UIDAI standard, Verhoeff dihedral group D5 check digit verified, biometric match.',
    expected: 'LOW RISK · ADMISSIBLE'
  },
  {
    id: 'deck_verhoeff_fail',
    backendPresetId: 'scenario5_tampered_aadhaar',
    tag: 'VERHOEFF CHECKSUM FAIL',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    title: 'Forged Aadhaar · Number Modification',
    subtitle: 'Data integrity layer tampering on printed demographic zone',
    docType: 'AADHAAR',
    docFile: 'scenario5_tampered_aadhaar_invalid_verhoeff.jpg',
    faceFile: 'presenter_rohit_matching.jpg',
    summary: 'Modified 12-digit Aadhaar number violating UIDAI dihedral D5 Verhoeff checksum algorithm.',
    expected: 'HIGH RISK · CHECKSUM INVALID'
  },
  {
    id: 'deck_interpol_hit',
    backendPresetId: 'deck_interpol_hit',
    tag: 'INTERPOL RED NOTICE HIT',
    tagColor: 'bg-red-100 text-red-800 border-red-300',
    title: 'Interpol Watchlist Persona (Rohit Sharma)',
    subtitle: 'Simulated law enforcement fugitive detection & arrest warrant',
    docType: 'PASSPORT',
    docFile: 'scenario1_genuine_indian_passport.jpg',
    faceFile: 'presenter_rohit_matching.jpg',
    summary: 'Document number P9823412 matches active CBI Interpol NCB Red Notice #2026-9041.',
    expected: 'CRITICAL (100%) · DETAIN PASSENGER'
  }
]

export default function CaptureStationPage({ onComplete, onCancel }) {
  const [step, setStep] = useState(1) // 1: Type, 2: Doc, 3: Face, 4: Processing
  const [docType, setDocType] = useState('AADHAAR')
  const [docImage, setDocImage] = useState(null)
  const [docBackImage, setDocBackImage] = useState(null)
  const [faceImage, setFaceImage] = useState(null)
  const [scanSide, setScanSide] = useState('front') // 'front' | 'back'
  const [facingMode, setFacingMode] = useState('environment') // 'environment' (rear) for doc, 'user' (selfie) for face
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingPhase, setProcessingPhase] = useState('')
  const [cameraUnavailable, setCameraUnavailable] = useState(false)
  const [showCalibrationModal, setShowCalibrationModal] = useState(false)
  const [loadingPresetId, setLoadingPresetId] = useState(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)
  const backFileInputRef = useRef(null)

  // WebCam utilities with rear/front support
  const startCamera = async (mode) => {
    stopCamera()
    setCameraUnavailable(false)
    const targetMode = mode || facingMode
    try {
      const constraints = {
        video: {
          facingMode: targetMode ? { ideal: targetMode } : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      streamRef.current = stream
    } catch (err) {
      console.warn("Camera exact mode failed, falling back to default:", err)
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream
        }
        streamRef.current = fallbackStream
      } catch (fallbackErr) {
        console.error("Camera access completely failed:", fallbackErr)
        setCameraUnavailable(true)
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0)
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
        const previewUrl = URL.createObjectURL(blob)
        
        if (step === 2) {
          if (scanSide === 'back') {
            setDocBackImage({ file, previewUrl })
            setScanSide('front')
            stopCamera()
          } else {
            setDocImage({ file, previewUrl })
            stopCamera()
            if (docType !== 'AADHAAR') {
              setStep(3)
            }
          }
        } else if (step === 3) {
          setFaceImage({ file, previewUrl })
          stopCamera()
          submitCase(file) // auto submit after face capture
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Reset file input so selecting the same file again triggers onChange
    e.target.value = ''
    
    const previewUrl = URL.createObjectURL(file)
    stopCamera()

    if (type === 'doc') {
      setDocImage({ file, previewUrl })
      if (docType !== 'AADHAAR') {
        setStep(3)
      }
    } else if (type === 'doc_back') {
      setDocBackImage({ file, previewUrl })
      setScanSide('front')
    } else {
      setFaceImage({ file, previewUrl })
      submitCase(file, docImage?.file)
    }
  }

  const fetchSampleImage = async (filename) => {
    const candidateUrls = [
      `${API_BASE}/static/samples/${filename}`,
      `/static/samples/${filename}`,
      `http://127.0.0.1:8000/static/samples/${filename}`
    ]
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url)
        if (res.ok) {
          const contentType = res.headers.get('content-type') || ''
          if (contentType.includes('text/html')) continue
          const blob = await res.blob()
          if (blob.size > 200) {
            return blob
          }
        }
      } catch {
        // continue to next URL candidate
      }
    }
    throw new Error(`Unable to load dataset image (${filename}). Please ensure backend or static assets are accessible.`)
  }

  const handleLoadPreset = async (preset, runImmediately = false) => {
    setLoadingPresetId(preset.id)
    try {
      // 1. If runImmediately is requested, try the fast preset API endpoint (< 1s execution)
      if (runImmediately && preset.backendPresetId) {
        setStep(4)
        setIsProcessing(true)
        setProcessingPhase('Executing defense benchmark arbitration...')
        stopCamera()
        setShowCalibrationModal(false)

        try {
          const res = await fetch(`${API_BASE}/api/v1/cases/preset/${preset.backendPresetId}`, {
            method: 'POST'
          })
          if (res.ok) {
            const caseData = await res.json()
            if (caseData?.case_id) {
              setTimeout(() => {
                onComplete(caseData.case_id)
              }, 800)
              return
            }
          }
        } catch (fastErr) {
          console.warn("Fast preset endpoint unavailable, falling back to full pipeline:", fastErr)
        }
      }

      // 2. Fetch doc image with candidate fallbacks
      const docBlob = await fetchSampleImage(preset.docFile)
      const docFileObj = new File([docBlob], preset.docFile, { type: docBlob.type || 'image/jpeg' })
      const docPreview = URL.createObjectURL(docBlob)

      // 3. Fetch face image with candidate fallbacks
      const faceBlob = await fetchSampleImage(preset.faceFile)
      const faceFileObj = new File([faceBlob], preset.faceFile, { type: faceBlob.type || 'image/jpeg' })
      const facePreview = URL.createObjectURL(faceBlob)

      // 4. Update inspection station state
      setDocType(preset.docType)
      setDocImage({ file: docFileObj, previewUrl: docPreview })
      setDocBackImage(null)
      setFaceImage({ file: faceFileObj, previewUrl: facePreview })
      stopCamera()
      setShowCalibrationModal(false)

      if (runImmediately) {
        submitCase(faceFileObj, docFileObj, preset.docType)
      } else {
        setStep(2)
      }
    } catch (err) {
      console.error("Preset loading error:", err)
      alert("Defense Benchmark Error: " + err.message)
      setIsProcessing(false)
      setStep(1)
    } finally {
      setLoadingPresetId(null)
    }
  }

  const submitCase = async (finalFaceFile, currentDocFile = null, overrideDocType = null) => {
    const activeDocFile = currentDocFile || docImage?.file
    const activeDocType = overrideDocType || docType
    if (!activeDocFile) {
      alert("Document file missing. Please scan or upload an ID document first.")
      setStep(2)
      return
    }

    setStep(4)
    setIsProcessing(true)
    
    // Multi-pillar screening progress phases
    const phases = [
      'Extracting document metadata...',
      'Running Verhoeff/MRZ validation...',
      'Verifying 2D barcode & digital QR signature...',
      'Screening Interpol Red Notice & SLTD watchlist...',
      'Performing ELA tampering analysis...',
      'Extracting facial biometrics...',
      'Computing similarity scores...',
      'Finalizing risk assessment...'
    ]
    
    let phaseIndex = 0
    setProcessingPhase(phases[0])
    const phaseInterval = setInterval(() => {
      phaseIndex++
      if (phaseIndex < phases.length) {
        setProcessingPhase(phases[phaseIndex])
      } else {
        clearInterval(phaseInterval)
      }
    }, 1000)

    try {
      const formData = new FormData()
      formData.append('doc_type', activeDocType)
      formData.append('doc_file', activeDocFile)
      if (docBackImage?.file) {
        formData.append('doc_back_file', docBackImage.file)
      }
      formData.append('live_file', finalFaceFile)

      const response = await fetch(`${API_BASE}/api/v1/cases/screen`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.detail || `Server error (${response.status})`)
      }
      
      const data = await response.json()
      
      // Ensure smooth visual transition
      setTimeout(() => {
        clearInterval(phaseInterval)
        onComplete(data.case_id)
      }, Math.max(0, 5000 - (phaseIndex * 1000)))

    } catch (error) {
      console.error("Screening error:", error)
      clearInterval(phaseInterval)
      alert(`Error processing case: ${error.message || 'Ensure backend is running.'}`)
      setStep(1)
      setIsProcessing(false)
    }
  }

  // Effect to handle camera lifecycle with automatic rear/front preference
  useEffect(() => {
    if (step === 2 && (!docImage || scanSide === 'back')) {
      const mode = 'environment'
      setFacingMode(mode)
      startCamera(mode)
    } else if (step === 3 && !faceImage) {
      const mode = 'user'
      setFacingMode(mode)
      startCamera(mode)
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [step, docImage, faceImage, scanSide])


  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-semibold text-[#615D73] hover:text-[#0B477A] transition cursor-pointer active:scale-95">
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <button
          type="button"
          onClick={() => setShowCalibrationModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-mono font-black text-amber-900 border border-amber-500/30 transition shadow-xs cursor-pointer active:opacity-80"
        >
          <Zap size={14} className="text-amber-600 fill-amber-600/30" />
          <span>⚡ DEFENSE BENCHMARKS (SIH TEST DECK)</span>
        </button>
      </div>

      <div className="glass-effect rounded-2xl overflow-hidden border border-slate-300/80 shadow-xs">
        {/* Progress Bar */}
        <div className="flex border-b border-slate-300/70 bg-slate-100/50">
          {[
            { num: 1, label: 'Classification' },
            { num: 2, label: 'Optical VIZ Scan' },
            { num: 3, label: '1:1 Biometrics' },
            { num: 4, label: 'Forensic Arbitration' }
          ].map((s) => (
            <div key={s.num} className={`flex-1 py-3 sm:py-3.5 px-1 sm:px-2 text-center text-xs sm:text-sm font-semibold transition-colors ${step >= s.num ? 'text-[#0B477A] bg-[#0B477A]/5 font-bold' : 'text-[#615D73]/70'}`}>
              <span className={`inline-flex size-5 sm:size-6 items-center justify-center rounded-md font-mono text-xs mr-1 sm:mr-2 transition-all ${step >= s.num ? 'glass-navy text-white font-bold' : 'bg-slate-200 text-[#615D73]'}`}>
                {s.num}
              </span>
              <span className="hidden sm:inline font-mono tracking-tight text-xs uppercase">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          {step === 1 && (
            <div className="animate-slide-in-right">
              <div className="text-center mb-6">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#0B477A] bg-[#0B477A]/10 px-2 py-0.5 rounded border border-[#0B477A]/20">
                  STEP 1 OF 4 · STATUTORY CLASSIFICATION
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#0B477A] mt-1.5">Select Credential Under Inspection</h2>
                <p className="text-xs text-[#615D73] mt-0.5">Determine document schema and regulatory checksum protocol.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {docTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => { setDocType(type.id); setStep(2); }}
                    className={`p-4 sm:p-4.5 rounded-xl border transition-all text-left hover-lift active:scale-98 cursor-pointer ${docType === type.id ? 'border-[#0B477A] glass-navy-subtle shadow-xs ring-2 ring-[#0B477A]/30' : 'border-slate-300/80 glass-card hover:bg-white'}`}
                  >
                    <div className="font-bold text-xs sm:text-sm text-[#0B477A]">{type.label}</div>
                    <div className="text-[11px] text-[#615D73] mt-1 leading-snug">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, step === 2 ? 'doc' : 'face')}
            className="hidden"
          />
          <input
            ref={backFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'doc_back')}
            className="hidden"
          />

          {/* STEP 2: Document Front Captured -> Show Dual-Side Review & QR Option */}
          {step === 2 && docImage && scanSide !== 'back' && (
            <div className="animate-slide-in-right space-y-6">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0B477A] mb-1">
                  Document Captured & Barcode Verification
                </h2>
                <p className="text-xs sm:text-sm text-[#615D73]">
                  {docType === 'AADHAAR' 
                    ? "Front side captured. Indian Aadhaar cards contain a secure digital QR code on the back. Add card backside to verify UIDAI cryptographic signature." 
                    : "Front side captured successfully. Review or proceed directly to live face biometric matching."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Front Side Card */}
                <div className="rounded-2xl glass-card border border-white/80 p-4 flex flex-col items-center">
                  <div className="flex items-center justify-between w-full mb-3 text-xs font-bold text-[#0B477A]">
                    <span className="flex items-center gap-1.5"><FileText size={15} /> Document Front</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                      <CheckCircle2 size={12} /> Ready
                    </span>
                  </div>
                  <div className="w-full aspect-[1.6] rounded-xl overflow-hidden bg-black/5 border border-slate-200 mb-3 flex items-center justify-center">
                    <img src={docImage.previewUrl} alt="Front ID" className="w-full h-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDocImage(null); setScanSide('front'); }}
                    className="text-xs font-semibold text-slate-500 hover:text-[#D30B0D] transition cursor-pointer"
                  >
                    Retake Front Scan
                  </button>
                </div>

                {/* Right Card: Live Presenter Face (if preloaded) OR Backside QR Option */}
                {faceImage ? (
                  <div className="rounded-2xl glass-card border border-white/80 p-4 flex flex-col items-center justify-between">
                    <div className="flex items-center justify-between w-full mb-3 text-xs font-bold text-[#0B477A]">
                      <span className="flex items-center gap-1.5"><ScanFace size={15} /> Live Presenter Photo</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                        <CheckCircle2 size={12} /> Biometrics Ready
                      </span>
                    </div>
                    <div className="w-full aspect-[1.6] rounded-xl overflow-hidden bg-black/5 border border-slate-200 mb-3 flex items-center justify-center">
                      <img src={faceImage.previewUrl} alt="Presenter Face" className="w-full h-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFaceImage(null); setStep(3); }}
                      className="text-xs font-semibold text-slate-500 hover:text-[#0B477A] transition cursor-pointer"
                    >
                      Use Live Webcam Instead
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl glass-card border border-white/80 p-4 flex flex-col items-center justify-between">
                    <div className="flex items-center justify-between w-full mb-3 text-xs font-bold text-[#0B477A]">
                      <span className="flex items-center gap-1.5"><QrCode size={15} /> Card Backside (QR Code)</span>
                      {docBackImage ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                          <CheckCircle2 size={12} /> Attached
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          {docType === 'AADHAAR' ? 'Recommended' : 'Optional'}
                        </span>
                      )}
                    </div>

                    {docBackImage ? (
                      <>
                        <div className="w-full aspect-[1.6] rounded-xl overflow-hidden bg-black/5 border border-slate-200 mb-3 flex items-center justify-center">
                          <img src={docBackImage.previewUrl} alt="Backside ID" className="w-full h-full object-contain" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setDocBackImage(null)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                        >
                          Remove Backside Image
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-white/40 text-center">
                        <div className="size-10 rounded-full bg-[#0B477A]/10 flex items-center justify-center mb-2">
                          <QrCode size={20} className="text-[#0B477A]" />
                        </div>
                        <p className="text-xs font-bold text-[#0B477A]">UIDAI Secure QR Verification</p>
                        <p className="text-[11px] text-[#615D73] mt-1 max-w-[220px] leading-relaxed">
                          Scan or upload reverse side to cryptographically check demographic integrity.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => { setScanSide('back'); startCamera('environment'); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0B477A] text-white text-xs font-bold hover:bg-[#08345a] transition cursor-pointer active:scale-95 shadow-xs"
                          >
                            <Camera size={13} /> Camera Scan
                          </button>
                          <button
                            type="button"
                            onClick={() => backFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-[#0B477A] border border-slate-200 text-xs font-bold hover:bg-slate-50 transition cursor-pointer active:scale-95 shadow-xs"
                          >
                            <Upload size={13} /> Upload Back
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2 Bottom Controls */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => { setDocImage(null); setDocBackImage(null); setFaceImage(null); setStep(1); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  ← Change Document Type
                </button>

                {faceImage ? (
                  <button
                    type="button"
                    onClick={() => submitCase(faceImage.file, docImage.file, docType)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#D30B0D] hover:bg-[#B3090B] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#D30B0D]/25 transition hover:-translate-y-0.5 active:scale-98 cursor-pointer"
                  >
                    <Play size={16} className="fill-white" />
                    <span>Execute AI Verification (Doc + Face)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { stopCamera(); setStep(3); }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#D30B0D] hover:bg-[#B3090B] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#D30B0D]/25 transition hover:-translate-y-0.5 active:scale-98 cursor-pointer"
                  >
                    <span>Proceed to Live Face Capture</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 Camera Scan (Front or Back) OR STEP 3 (Live Face Capture) */}
          {((step === 2 && (!docImage || scanSide === 'back')) || step === 3) && (
            <div className="animate-slide-in-right text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B477A] mb-1 sm:mb-2">
                {step === 2 
                  ? (scanSide === 'back' ? 'Scan Card Backside (QR Code)' : 'Scan Document Front')
                  : 'Live Face Capture'}
              </h2>
              <p className="text-xs sm:text-sm text-[#615D73] mb-5 sm:mb-8">
                {step === 2 
                  ? (scanSide === 'back' 
                      ? 'Hold the reverse side with the QR code centered in the frame.' 
                      : 'Position the document clearly in the frame.')
                  : 'Look directly at the camera.'}
              </p>

              {step === 3 && docImage && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-300 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Document loaded: {docImage.file.name || 'Captured Document'}</span>
                  {docBackImage && <span className="text-emerald-700 font-bold">(+ Backside QR)</span>}
                </div>
              )}

              <div className="relative mx-auto max-w-lg aspect-[4/3] sm:aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white/80">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} 
                />
                {/* Minimalist Professional Card Alignment Frame */}
                <div className="absolute inset-0 m-6 sm:m-8 rounded-2xl pointer-events-none border border-white/20">
                  <div className="absolute top-0 left-0 size-6 border-t-2 border-l-2 border-white/80 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 size-6 border-t-2 border-r-2 border-white/80 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 size-6 border-b-2 border-l-2 border-white/80 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 size-6 border-b-2 border-r-2 border-white/80 rounded-br-xl" />
                </div>

                {/* Mobile Camera Flip Button */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white border border-white/30 hover:bg-black/80 transition active:scale-95 cursor-pointer shadow-lg"
                  title="Switch between front and rear cameras"
                >
                  <SwitchCamera size={14} className="text-white" />
                  <span className="text-[11px]">{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
                </button>

                {/* Camera Unavailable Overlay */}
                {cameraUnavailable && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900/90 text-white text-center z-10 animate-fade-in-up">
                    <div className="size-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                      <Camera size={24} />
                    </div>
                    <h3 className="font-bold text-sm sm:text-base">Camera Not Available</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                      Camera access was denied or no device is connected. Please use the button below to upload an image from your device.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 2 && scanSide === 'back') {
                          backFileInputRef.current?.click()
                        } else {
                          fileInputRef.current?.click()
                        }
                      }}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white text-[#0B477A] px-4 py-2 font-bold text-xs hover:bg-slate-100 transition cursor-pointer active:scale-95 shadow-md"
                    >
                      <Upload size={14} /> Upload {step === 2 ? (scanSide === 'back' ? 'Backside Image' : 'Document Image') : 'Face Photo'}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
                <button
                  type="button"
                  onClick={captureImage}
                  disabled={cameraUnavailable}
                  className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 sm:py-3 font-bold text-white transition hover:-translate-y-0.5 active:scale-98 cursor-pointer shadow-md ${
                    cameraUnavailable
                      ? 'bg-slate-400 opacity-50 cursor-not-allowed shadow-none'
                      : 'bg-[#D30B0D] hover:bg-[#B3090B] shadow-[#D30B0D]/25'
                  }`}
                >
                  <Camera size={20} /> Capture Now
                </button>
                
                <div className="w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 2 && scanSide === 'back') {
                        backFileInputRef.current?.click()
                      } else {
                        fileInputRef.current?.click()
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl glass-card px-6 py-3.5 sm:py-3 font-bold text-[#0B477A] transition hover:bg-white border border-white/80 cursor-pointer shadow-xs active:scale-98"
                  >
                    <Upload size={20} /> Upload {step === 2 ? (scanSide === 'back' ? 'Backside QR' : 'Document Front') : 'Face Photo'}
                  </button>
                </div>

                {step === 2 && scanSide === 'back' && (
                  <button
                    type="button"
                    onClick={() => { setScanSide('front'); stopCamera(); }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition py-2"
                  >
                    Cancel Backside Scan
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-12 text-center">
              <div className="relative mx-auto size-32 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-[#615D73]/15" />
                <div className="absolute inset-0 rounded-full border-4 border-[#0B477A] border-t-transparent animate-spin shadow-[0_0_20px_rgba(11,71,122,0.35)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity size={40} className="text-[#D30B0D] animate-pulse-soft" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#0B477A] mb-2">AI Verification in Progress</h2>
              <p className="text-[#0B477A] font-semibold animate-pulse">{processingPhase}</p>
              
              <div className="mt-10 max-w-md mx-auto space-y-4 text-left">
                {[
                  { icon: FileText, label: 'Document Integrity' },
                  { icon: ScanFace, label: 'Biometric Matching' },
                  { icon: ShieldAlert, label: 'Tamper Detection' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass-card border border-white/80 shadow-xs">
                    <item.icon size={20} className="text-[#0B477A]" />
                    <span className="font-semibold text-[#0B477A]">{item.label}</span>
                    <div className="ml-auto flex-1 max-w-[100px] h-2 bg-[#615D73]/15 rounded-full overflow-hidden">
                      <div className="h-full bg-[#D30B0D] animate-progress-fill" style={{ animationDelay: `${i * 0.8}s` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Calibration Test Deck Modal */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65">
          <div className="bg-white max-w-xl w-full rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl glass-navy text-white shadow-xs">
                  <Zap size={18} className="text-amber-300" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0B477A]">
                    System Verification & Calibration Deck
                  </h3>
                  <p className="text-xs text-[#615D73]">
                    Pre-loaded reference standards for auditing forensic sensitivity and watchlist tripwires.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCalibrationModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Streamlined Preset Rows */}
            <div className="space-y-2.5">
              {CALIBRATION_PRESETS.map((deck) => {
                const isLoading = loadingPresetId === deck.id
                return (
                  <div 
                    key={deck.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-[#0B477A]/40 bg-slate-50/60 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${deck.tagColor}`}>
                          {deck.tag}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">{deck.docType}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#0B477A] truncate">
                        {deck.title}
                      </h4>
                      <p className="text-[11px] text-[#615D73] truncate">
                        {deck.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={!!loadingPresetId}
                        onClick={() => handleLoadPreset(deck, false)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-[#0B477A] font-bold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        Load Preview
                      </button>
                      <button
                        type="button"
                        disabled={!!loadingPresetId}
                        onClick={() => handleLoadPreset(deck, true)}
                        className="px-3 py-1.5 rounded-xl glass-navy text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="animate-spin text-xs">●</span>
                        ) : (
                          <Play size={11} className="fill-white" />
                        )}
                        <span>Run Now</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer Note */}
            <div className="pt-2 text-center text-[11px] text-[#615D73] border-t border-slate-100">
              Loads verified document and live biometric reference pairs from <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px]">/static/samples/</code>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
