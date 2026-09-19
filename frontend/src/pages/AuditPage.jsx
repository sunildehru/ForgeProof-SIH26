import { useState, useEffect } from 'react'
import { CheckCircle2, FileKey2, ShieldCheck, Activity, RefreshCw, Hash, Lock } from 'lucide-react'
import { API_BASE } from '../config'

export default function AuditPage() {
  const [ledgerData, setLedgerData] = useState(null)
  const [filter, setFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchLedger = () => {
    setIsLoading(true)
    fetch(`${API_BASE}/api/v1/audit`)
      .then(res => res.json())
      .then(data => {
        setLedgerData(data)
      })
      .catch(err => console.error('Failed to fetch audit ledger:', err))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchLedger()
    const interval = setInterval(fetchLedger, 10000)
    return () => clearInterval(interval)
  }, [])

  const entries = ledgerData?.ledger || []
  const filteredEntries = filter
    ? entries.filter(e => 
        e.case_id?.toLowerCase().includes(filter.toLowerCase()) ||
        e.officer_id?.toLowerCase().includes(filter.toLowerCase()) ||
        e.action?.toLowerCase().includes(filter.toLowerCase()) ||
        e.verdict?.toLowerCase().includes(filter.toLowerCase())
      )
    : entries

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#0B477A] flex items-center gap-1.5">
            <Lock size={13} className="text-[#0B477A]" /> Immutable SHA-256 Ledger
          </p>
          <h1 className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B477A]">
            Chain of Custody Audit
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#615D73]">
            Cryptographically sealed audit trail recording every document screening and officer decision.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchLedger}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-white/80 border border-[#615D73]/20 px-3 sm:px-3.5 py-2 text-xs font-bold text-[#615D73] hover:text-[#0B477A] hover:border-[#0B477A]/40 transition shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#0B477A]' : 'text-[#0B477A]'} />
            <span className="hidden sm:inline">Refresh Ledger</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.3fr_.7fr]">
        {/* Ledger Integrity Sidebar (order-1 on mobile so status is visible immediately) */}
        <aside className="space-y-4 sm:space-y-5 order-1 lg:order-2">
          <div className="glass-effect rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 space-y-3 border border-white/70">
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-2.5 shrink-0 ${ledgerData?.integrity ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-[#D30B0D] text-white shadow-md shadow-[#D30B0D]/30'}`}>
                <ShieldCheck size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-[#0B477A] truncate">
                  {ledgerData?.integrity ? 'Ledger Cryptographically Intact' : 'Integrity Compromised'}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#615D73] font-medium">
                  {ledgerData?.integrity ? 'All SHA-256 block hashes verified backwards to genesis.' : 'Hash chain inconsistency detected.'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 space-y-3 sm:space-y-4 border border-white/70">
            <div className="flex items-center gap-2.5 text-[#0B477A] font-extrabold text-sm">
              <Hash size={17} className="text-[#0B477A]" />
              <span>Cryptographic Specs</span>
            </div>

            <dl className="space-y-2.5 sm:space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#615D73]/15">
                <dt className="text-[#615D73]">Hash Algorithm</dt>
                <dd className="font-mono font-bold text-[#0B477A]">SHA-256 Chained</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-[#615D73]/15">
                <dt className="text-[#615D73]">Total Sealed Blocks</dt>
                <dd className="font-mono font-bold text-[#0B477A]">{ledgerData?.total_entries || 0}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-[#615D73]/15">
                <dt className="text-[#615D73]">Immutability Standard</dt>
                <dd className="font-semibold text-[#0B477A]">Tamper-Evident Merkle Chain</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-[#615D73]">Compliance</dt>
                <dd className="font-semibold text-emerald-700">Digital Evidence Act · Section 65B</dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* Ledger Entries List (order-2 on mobile) */}
        <section className="glass-effect rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 space-y-4 order-2 lg:order-1 border border-white/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <h2 className="text-sm sm:text-base font-extrabold text-[#0B477A]">
              Verified Audit Blocks ({filteredEntries.length})
            </h2>
            <input
              type="text"
              placeholder="Filter by Case, Officer, Action..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-3 py-2 sm:py-1.5 rounded-xl border border-white/80 bg-white/70 text-xs text-[#0B477A] placeholder:text-[#615D73]/60 focus:outline-none focus:ring-2 focus:ring-[#0B477A]/20 focus:border-[#0B477A] w-full sm:w-56"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-[#615D73]/70 text-xs">
                No audit entries match the current filter.
              </div>
            ) : (
              [...filteredEntries].reverse().map((entry, index) => (
                <div key={entry.entry_id} className="rounded-2xl border border-white/80 glass-card p-4 space-y-2 hover:bg-white/95 transition shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold glass-navy-subtle text-[#0B477A] px-2 py-0.5 rounded-md">
                        #{entry.entry_id}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {entry.case_id}
                      </span>
                      <span className="text-[11px] font-semibold text-[#615D73]">
                        {entry.action}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      entry.verdict === 'LOW' || entry.verdict === 'APPROVED' || entry.verdict === 'AUTHORIZED' ? 'bg-emerald-100 text-emerald-800' :
                      entry.verdict === 'MEDIUM' || entry.verdict === 'SECONDARY_REVIEW' ? 'bg-amber-100 text-amber-800' :
                      'bg-[#D30B0D]/10 text-[#D30B0D] border border-[#D30B0D]/30'
                    }`}>
                      {entry.verdict}
                    </span>
                  </div>

                  <p className="text-xs text-[#615D73] font-medium">
                    {entry.notes || 'Automated screening record'}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[10px] text-[#615D73]/80 pt-1 border-t border-[#615D73]/10 gap-2">
                    <span>Officer: <strong className="text-[#0B477A]">{entry.officer_id}</strong> · {new Date(entry.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="bg-slate-900 text-slate-300 rounded-xl p-2.5 font-mono text-[10px] space-y-1">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-500 shrink-0">PREV:</span>
                      <span className="truncate">{entry.prev_hash}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate text-slate-200">
                      <span className="text-slate-500 shrink-0">HASH:</span>
                      <span className="truncate">{entry.entry_hash}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
