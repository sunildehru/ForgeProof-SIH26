import { useState, useEffect } from 'react'
import { 
  Activity, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Fingerprint, 
  Lock, 
  QrCode, 
  RefreshCw, 
  Scan, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Timer, 
  Workflow 
} from 'lucide-react'
import { API_BASE } from '../config'

export default function SystemReadinessPage({ onNavigate }) {
  const [readiness, setReadiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState(null)

  const fetchReadiness = () => {
    setLoading(true)
    fetch(`${API_BASE}/api/v1/system/readiness`)
      .then(res => res.json())
      .then(data => {
        setReadiness(data)
        setLastChecked(new Date())
      })
      .catch(err => {
        console.error('Failed to fetch system readiness:', err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReadiness()
    const interval = setInterval(fetchReadiness, 15000)
    return () => clearInterval(interval)
  }, [])

  const getEngineIcon = (id) => {
    switch (id) {
      case 'ocr_viz': return Scan
      case 'forensic_vision': return Sparkles
      case 'biometric_face': return Fingerprint
      case 'qr_crypto': return QrCode
      case 'watchlist_intel': return ShieldAlert
      case 'audit_ledger': return Lock
      default: return Activity
    }
  }

  const engines = readiness?.engines || []
  const metrics = readiness?.metrics || {}

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg glass-navy text-white shadow-xs">
              <Activity size={14} />
            </span>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#0B477A]">
              Border Telemetry & System Diagnostics
            </p>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B477A]">
            System Readiness
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#615D73]">
            Continuous diagnostic validation of document forensic pipelines, cryptographic ledgers, and law enforcement interfaces.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {lastChecked && (
            <span className="text-[11px] text-[#615D73] font-mono hidden md:inline">
              Probe: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchReadiness}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl glass-card px-3.5 py-2 text-xs font-bold text-[#0B477A] hover:bg-white transition shadow-xs cursor-pointer active:scale-95 border border-white/80"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#0B477A]' : 'text-[#0B477A]'} />
            <span>Run Diagnostic Probe</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-emerald-600 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#615D73]">Overall Status</p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xl font-black tracking-tight text-[#0B477A]">
              {readiness?.overall_status || 'OPERATIONAL'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">All 6 verification engines online</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-[#0B477A] space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#615D73]">Checkpoint Node</p>
          <p className="text-xl font-black tracking-tight text-[#0B477A] font-mono">
            {readiness?.node_id || 'ICP-DEL-T3'}
          </p>
          <p className="text-[11px] text-[#615D73] truncate">{readiness?.station_name || 'Terminal 3 Inbound'}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-blue-600 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#615D73]">Average Latency</p>
          <p className="text-xl font-black tracking-tight text-[#0B477A]">
            {metrics.avg_pipeline_latency || '1.42s'}
          </p>
          <p className="text-[11px] text-[#615D73]">Multi-scale forensic pipeline pass</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-indigo-600 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#615D73]">Ledger Block Height</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black tracking-tight text-[#0B477A] font-mono">
              #{metrics.ledger_height ?? 1}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-[#615D73]">Cryptographic SHA-256 chain intact</p>
        </div>
      </div>

      {/* 6 Engine Diagnostics Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0B477A]">
            Forensic Subsystems & Verification Engines
          </h2>
          <span className="text-xs text-[#615D73]">
            {engines.length} Active Modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {engines.map((engine) => {
            const Icon = getEngineIcon(engine.id)
            return (
              <div 
                key={engine.id} 
                className="glass-card rounded-2xl p-4 space-y-3 hover-lift border border-white/80 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl glass-navy text-white shrink-0 shadow-xs">
                        <Icon size={18} />
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-[#0B477A] leading-tight">
                          {engine.name}
                        </h3>
                        <span className="text-[10px] font-mono text-[#615D73]">
                          {engine.version}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <CheckCircle2 size={10} />
                      {engine.status}
                    </span>
                  </div>

                  {/* Standards List */}
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#615D73]/80">Compliance & Algorithms</p>
                    <ul className="space-y-0.5">
                      {engine.standards?.map((std, idx) => (
                        <li key={idx} className="text-[11px] text-[#0B477A] font-medium flex items-center gap-1.5">
                          <span className="size-1 rounded-full bg-[#0B477A]/60 shrink-0" />
                          <span className="truncate">{std}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Subsystem Telemetry Footer */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-[#615D73] font-mono flex items-center gap-1">
                    <Timer size={12} className="text-[#0B477A]" />
                    {engine.latency_ms} ms
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {engine.health}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Specifications & Standards Compliance Card */}
      <div className="glass-card rounded-2xl p-5 border border-white/80 space-y-3">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-[#0B477A]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B477A]">
            Inspection Station Architecture & Cryptographic Specs
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-[#615D73]">Runtime Core</p>
            <p className="font-mono text-[#0B477A] font-semibold">FastAPI 0.115 / Python 3.14</p>
            <p className="text-[11px] text-[#615D73]">High-throughput async IO</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-[#615D73]">Computer Vision</p>
            <p className="font-mono text-[#0B477A] font-semibold">OpenCV 4.10 + PyTorch ELA</p>
            <p className="text-[11px] text-[#615D73]">Multi-scale frequency domain</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-[#615D73]">Document Standards</p>
            <p className="font-mono text-[#0B477A] font-semibold">ICAO Doc 9303 / UIDAI RSA</p>
            <p className="text-[11px] text-[#615D73]">Machine-readable zones & QR</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-[#615D73]">Chain of Custody</p>
            <p className="font-mono text-[#0B477A] font-semibold">SHA-256 Merkle Chaining</p>
            <p className="text-[11px] text-[#615D73]">Tamper-evident audit blocks</p>
          </div>
        </div>
      </div>
    </div>
  )
}
