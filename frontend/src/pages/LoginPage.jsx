import { useState } from 'react'
import { ShieldCheck, Lock, AlertCircle, UserCheck, KeyRound, AlertTriangle } from 'lucide-react'
import { API_BASE } from '../config'
import { ForgeProofLogo, ForgeProofEmblem } from '../components/ForgeProofLogo'

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

      const contentType = response.headers.get('content-type') || ''
      let data = {}
      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => ({}))
      }

      if (!response.ok) {
        throw new Error(data?.detail || `Authentication failed (HTTP ${response.status}). Please check credentials and backend connectivity.`)
      }

      if (!data?.token || !data?.officer) {
        throw new Error('Authentication server returned an invalid response structure.')
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
        {/* Prototype & Hackathon Disclaimer Tile */}
        <div className="mb-4 rounded-lg border-2 border-amber-300 bg-amber-50/95 p-3 shadow-xs text-left">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold uppercase tracking-wider text-amber-900 block text-[10.5px]">
                Smart India Hackathon (SIH 2026) · Evaluation Prototype
              </span>
              <p className="text-amber-800 mt-0.5">
                This portal is an academic prototype developed for <strong>SIH Problem Statement SIH26</strong>. 
                It is <strong>not an official Government of India website</strong> and is intended strictly for demonstration and research purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Government Portal Header */}
        <div className="mb-4 text-center">
          <div className="flex justify-center mb-3">
            <ForgeProofEmblem className="h-16 w-auto drop-shadow-xs" />
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
          <div className="mt-2 text-sm font-bold tracking-tight text-[#003366]">
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
