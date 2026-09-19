import { useState } from 'react'
import { ShieldCheck, Lock, AlertCircle, UserCheck, KeyRound } from 'lucide-react'
import { API_BASE } from '../config'

function AshokaEmblem({ className = "h-16 w-auto" }) {
  return (
    <svg className={className} viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="State Emblem of India">
      <path d="M50 8 C43 8 38 15 38 23 C38 30 43 36 44 40 C44 43 41 46 38 48 C34 50 30 55 30 62 C30 70 38 76 50 76 C62 76 70 70 70 62 C70 55 66 50 62 48 C59 46 56 43 56 40 C57 36 62 30 62 23 C62 15 57 8 50 8Z" fill="#003366" />
      <path d="M28 26 C22 26 18 32 18 40 C18 46 23 52 25 56 C27 60 25 64 22 68 C27 73 34 72 37 68 C35 62 34 56 34 50 C34 44 36 36 36 32 C33 28 30 26 28 26Z" fill="#003366" />
      <path d="M72 26 C78 26 82 32 82 40 C82 46 77 52 75 56 C73 60 75 64 78 68 C73 73 66 72 63 68 C65 62 66 56 66 50 C66 44 64 36 64 32 C67 28 70 26 72 26Z" fill="#003366" />
      <rect x="14" y="78" width="72" height="10" rx="2" fill="#003366" />
      <circle cx="50" cy="83" r="4.5" stroke="#FFFFFF" strokeWidth="1.2" />
      <circle cx="50" cy="83" r="1.5" fill="#FFFFFF" />
      <path d="M20 90 C20 90 28 99 50 99 C72 99 80 90 80 90 L84 105 L16 105 Z" fill="#003366" />
      <rect x="10" y="107" width="80" height="5" rx="1" fill="#003366" />
      <text x="50" y="123" textAnchor="middle" fontSize="7" fontWeight="900" fill="#003366" letterSpacing="0.5">
        सत्यमेव जयते
      </text>
    </svg>
  )
}

export default function LoginPage({ onLogin }) {
  const [officerId, setOfficerId] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: officerId.trim(), password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed. Please verify credentials.')
      }

      onLogin(data.officer, data.token)
    } catch (err) {
      console.error('Login error:', err)
      setErrorMsg(err.message || 'Could not connect to authentication service.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#EDF2F7] px-4 py-8 text-[#1E293B]">
      {/* Tricolor top border */}
      <div className="fixed top-0 left-0 right-0 tricolor-stripe" />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Government Portal Header */}
        <div className="mb-4 text-center">
          <div className="flex justify-center mb-2">
            <AshokaEmblem className="h-16 w-auto drop-shadow-xs" />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#003366]">
            GOVERNMENT OF INDIA
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            MINISTRY OF HOME AFFAIRS (POLICE II DIVISION)
          </div>
          <div className="text-sm font-black uppercase tracking-tight text-[#003366] mt-0.5">
            SASHASTRA SEEMA BAL (SSB)
          </div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">
            ForgeProof Border Screening & Document Verification Workstation
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-lg border-2 border-[#003366] shadow-md overflow-hidden">
          <div className="bg-[#003366] px-6 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-400" />
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                Officer Authentication
              </h1>
            </div>
            <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-amber-300 font-bold">
              FIPS 140-3
            </span>
          </div>

          <div className="p-6">
            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded bg-rose-50 border border-[#D30B0D]/30 p-3 text-xs font-semibold text-[#D30B0D] animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="officer-id" className="text-xs font-bold text-[#003366] block uppercase tracking-wider">
                  Officer ID / Badge Number
                </label>
                <input
                  id="officer-id"
                  autoComplete="username"
                  placeholder="e.g. admin or OFFICER_IND_829"
                  value={officerId}
                  onChange={e => setOfficerId(e.target.value)}
                  className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 outline-none transition font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-bold text-[#003366] block uppercase tracking-wider">
                  Passcode / Security Key
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter security passcode"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 outline-none transition font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                className="h-10 w-full rounded bg-[#003366] hover:bg-[#002244] font-bold text-white transition text-xs uppercase tracking-wider disabled:opacity-50 mt-2 shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Authenticating credentials...
                  </span>
                ) : (
                  <>
                    <UserCheck size={16} />
                    Sign In to Workstation
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-200 text-center space-y-1">
              <p className="text-[11px] font-semibold text-slate-500">
                Sashastra Seema Bal (SSB) · Border Checkpoint & Integrated Check Post (ICP)
              </p>
              <p className="text-[10px] text-slate-400">
                Unauthorized access is strictly prohibited under the Information Technology Act 2000 & Official Secrets Act.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Fill Preset Buttons for Hackathon Reviewers */}
        <div className="mt-3.5 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 font-bold">
            <KeyRound size={13} className="text-[#003366]" />
            <span>Hackathon Reviewer Credentials (Click to Auto-Fill):</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => { setOfficerId('admin'); setPassword('admin123'); setErrorMsg(''); }}
              className="px-3 py-1.5 text-xs rounded-md border border-[#003366]/30 bg-white hover:bg-slate-50 font-mono text-[#003366] font-bold transition active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1.5 hover:border-[#003366]"
              title="Auto-fill admin reviewer credentials"
            >
              <span className="font-semibold text-slate-500 font-sans">Admin:</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[#003366]">admin</span>
              <span className="text-slate-400">/</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">admin123</span>
            </button>
            <button
              type="button"
              onClick={() => { setOfficerId('OFFICER_IND_829'); setPassword('border-secure-2026'); setErrorMsg(''); }}
              className="px-3 py-1.5 text-xs rounded-md border border-[#003366]/30 bg-white hover:bg-slate-50 font-mono text-[#003366] font-bold transition active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1.5 hover:border-[#003366]"
              title="Auto-fill border inspector credentials"
            >
              <span className="font-semibold text-slate-500 font-sans">Inspector:</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[#003366]">OFFICER_IND_829</span>
              <span className="text-slate-400">/</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">border-secure-2026</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tricolor bottom border */}
      <div className="fixed bottom-0 left-0 right-0 tricolor-stripe" />
    </main>
  )
}
