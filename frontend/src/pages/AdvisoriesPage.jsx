import { useState, useEffect } from 'react'
import { 
  AlertOctagon, 
  AlertTriangle, 
  BadgeAlert, 
  FileWarning, 
  Globe2, 
  Radio, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  UserX, 
  ShieldBan,
  Building2,
  Calendar,
  CreditCard
} from 'lucide-react'
import { API_BASE } from '../config'

export default function AdvisoriesPage() {
  const [advisories, setAdvisories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [lastSync, setLastSync] = useState(null)

  const fetchAdvisories = () => {
    setLoading(true)
    fetch(`${API_BASE}/api/v1/watchlists`)
      .then(res => res.json())
      .then(data => {
        setAdvisories(data.records || [])
        setLastSync(new Date())
      })
      .catch(err => {
        console.error('Failed to fetch watchlists and advisories:', err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAdvisories()
    const interval = setInterval(fetchAdvisories, 20000)
    return () => clearInterval(interval)
  }, [])

  const categories = [
    { id: 'ALL', label: 'All Intelligence' },
    { id: 'INTERPOL RED NOTICE', label: 'Interpol Red Notices' },
    { id: 'NATIONAL BORDER LOOKOUT CIRCULAR (LOC)', label: 'National LOCs' },
    { id: 'STOLEN TRAVEL DOCUMENT (SLTD)', label: 'Stolen Passports (SLTD)' },
    { id: 'TECHNICAL FORGERY ADVISORY', label: 'Technical Bulletins' }
  ]

  const filtered = advisories.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.notice_type === selectedCategory
    const q = searchTerm.toLowerCase().trim()
    if (!q) return matchesCategory

    const matchesSearch = 
      (item.notice_id && item.notice_id.toLowerCase().includes(q)) ||
      (item.target_name && item.target_name.toLowerCase().includes(q)) ||
      (item.alias && item.alias.toLowerCase().includes(q)) ||
      (item.doc_number && item.doc_number.toLowerCase().includes(q)) ||
      (item.issuing_state && item.issuing_state.toLowerCase().includes(q)) ||
      (item.offense && item.offense.toLowerCase().includes(q))

    return matchesCategory && matchesSearch
  })

  const criticalCount = advisories.filter(a => a.severity === 'CRITICAL').length
  const highCount = advisories.filter(a => a.severity === 'HIGH').length

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg glass-navy text-white shadow-xs">
              <Radio size={14} className="animate-pulse" />
            </span>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#0B477A]">
              Law Enforcement Broadcast Feed
            </p>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B477A]">
            Active Advisories & Watchlists
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#615D73]">
            Operational Interpol Red Notices, National Lookout Circulars (LOC), and high-vigilance forgery bulletins.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {lastSync && (
            <span className="text-[11px] text-[#615D73] font-mono hidden md:inline">
              Feed Synced: {lastSync.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAdvisories}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl glass-card px-3.5 py-2 text-xs font-bold text-[#0B477A] hover:bg-white transition shadow-xs cursor-pointer active:scale-95 border border-white/80"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#0B477A]' : 'text-[#0B477A]'} />
            <span>Sync Live Feed</span>
          </button>
        </div>
      </div>

      {/* Intelligence Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-rose-600 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#615D73]">Critical Warrants / Red Notices</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black tracking-tight text-[#D30B0D] font-mono">
              {criticalCount}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              Immediate Detain
            </span>
          </div>
          <p className="text-[11px] text-rose-700">Immediate apprehension protocol active</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-amber-500 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#615D73]">National LOC & Travel Bans</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black tracking-tight text-amber-800 font-mono">
              {highCount}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Boarding Refusal
            </span>
          </div>
          <p className="text-[11px] text-amber-700">Non-bailable warrant and travel embargoes</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-[#0B477A] space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#615D73]">Total Feed Registry</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black tracking-tight text-[#0B477A] font-mono">
              {advisories.length}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0B477A]/10 text-[#0B477A] border border-[#0B477A]/20">
              Live Socket
            </span>
          </div>
          <p className="text-[11px] text-[#615D73]">Sync with CBI Interpol NCB & Lyon Central</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-3 border border-white/80 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#615D73]" />
            <input
              type="text"
              placeholder="Search by subject name, passport/ID number, notice ID, or offense..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/70 border border-slate-200 text-[#0B477A] placeholder-[#615D73]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B477A]/30 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    active
                      ? 'glass-navy text-white shadow-xs'
                      : 'text-[#615D73] hover:bg-[#0B477A]/10 hover:text-[#0B477A]'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Advisories Cards Grid */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center border border-white/80 space-y-3">
            <ShieldAlert size={36} className="mx-auto text-[#615D73]/40" />
            <p className="text-sm font-bold text-[#0B477A]">No advisory records matched your filter</p>
            <p className="text-xs text-[#615D73]">Try broadening your search term or select "All Intelligence".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item, idx) => {
              const isCritical = item.severity === 'CRITICAL'
              return (
                <div 
                  key={item.notice_id || idx}
                  className={`glass-card rounded-2xl p-4.5 space-y-3.5 border transition hover-lift ${
                    isCritical ? 'border-rose-300/80' : 'border-white/80'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded-md glass-navy text-white">
                        {item.notice_id}
                      </span>
                      <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wide text-[#0B477A]">
                        {item.notice_type}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                      isCritical
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse-soft'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {isCritical ? <AlertOctagon size={11} /> : <AlertTriangle size={11} />}
                      {item.severity}
                    </span>
                  </div>

                  {/* Subject Details */}
                  <div className="bg-white/60 rounded-xl p-3 space-y-2 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#615D73] font-semibold">Target / Subject:</span>
                      <span className="font-extrabold text-[#0B477A]">{item.target_name}</span>
                    </div>

                    {item.alias && item.alias !== 'None' && item.alias !== 'NONE' && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#615D73] font-semibold">Known Aliases:</span>
                        <span className="font-medium text-[#615D73]">{item.alias}</span>
                      </div>
                    )}

                    {item.doc_number && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#615D73] font-semibold">Flagged Doc / Batch:</span>
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {item.doc_number}
                        </span>
                      </div>
                    )}

                    {item.dob && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#615D73] font-semibold">Date of Birth:</span>
                        <span className="font-mono text-[#615D73]">{item.dob}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                      <span className="text-[#615D73] font-semibold">Issuing Authority:</span>
                      <span className="font-medium text-[#0B477A] text-right truncate max-w-[200px]">
                        {item.issuing_state}
                      </span>
                    </div>
                  </div>

                  {/* Offense */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#615D73]/80">Offense / Advisory Details</p>
                    <p className="text-xs text-[#0B477A] leading-relaxed">
                      {item.offense}
                    </p>
                  </div>

                  {/* Mandated Action Directive */}
                  <div className={`rounded-xl p-2.5 text-xs font-bold flex items-center gap-2 ${
                    isCritical 
                      ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    <ShieldAlert size={15} className="shrink-0" />
                    <span className="truncate">{item.action_required}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
