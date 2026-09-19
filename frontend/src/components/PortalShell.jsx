import { useState, useEffect } from 'react'
import { Bell, ClipboardList, FileSearch, LayoutDashboard, LogOut, ShieldCheck, ScanLine, UserCheck, MapPin, Moon, Sun, Volume2, VolumeX, Activity, Radio, Clock, Globe2, ChevronDown, CheckCircle2, ShieldAlert, Languages } from 'lucide-react'
import { isAudioMuted, setAudioMuted } from '../utils/audioAlerts'
import { useLanguage } from '../utils/LanguageContext'

function AshokaEmblem({ className = "h-14 w-auto" }) {
  return (
    <svg className={className} viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="State Emblem of India">
      {/* 3 Lions representation */}
      <path d="M50 8 C43 8 38 15 38 23 C38 30 43 36 44 40 C44 43 41 46 38 48 C34 50 30 55 30 62 C30 70 38 76 50 76 C62 76 70 70 70 62 C70 55 66 50 62 48 C59 46 56 43 56 40 C57 36 62 30 62 23 C62 15 57 8 50 8Z" fill="#003366" />
      {/* Left Lion Profile */}
      <path d="M28 26 C22 26 18 32 18 40 C18 46 23 52 25 56 C27 60 25 64 22 68 C27 73 34 72 37 68 C35 62 34 56 34 50 C34 44 36 36 36 32 C33 28 30 26 28 26Z" fill="#003366" />
      {/* Right Lion Profile */}
      <path d="M72 26 C78 26 82 32 82 40 C82 46 77 52 75 56 C73 60 75 64 78 68 C73 73 66 72 63 68 C65 62 66 56 66 50 C66 44 64 36 64 32 C67 28 70 26 72 26Z" fill="#003366" />
      {/* Abacus Base */}
      <rect x="14" y="78" width="72" height="10" rx="2" fill="#003366" />
      {/* Ashoka Chakra in Center */}
      <circle cx="50" cy="83" r="4.5" stroke="#FFFFFF" strokeWidth="1.2" />
      <circle cx="50" cy="83" r="1.5" fill="#FFFFFF" />
      {/* Lotus Bell Pedestal */}
      <path d="M20 90 C20 90 28 99 50 99 C72 99 80 90 80 90 L84 105 L16 105 Z" fill="#003366" />
      {/* Plinth */}
      <rect x="10" y="107" width="80" height="5" rx="1" fill="#003366" />
      {/* Satyameva Jayate (Devanagari text) */}
      <text x="50" y="123" textAnchor="middle" fontSize="7" fontWeight="900" fill="#003366" letterSpacing="0.5">
        सत्यमेव जयते
      </text>
    </svg>
  )
}

export default function PortalShell({ children, activePage, onNavigate, officer, onLogout }) {
  const { lang, setLang, toggleLang, t } = useLanguage()
  const [isDarkBooth, setIsDarkBooth] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('forgeproof_dark_booth') === 'true';
  })
  const [isMuted, setIsMutedState] = useState(() => isAudioMuted())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [fontSize, setFontSize] = useState('normal') // normal | large | xlarge

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isDarkBooth) {
      document.body.classList.add('dark-booth')
    } else {
      document.body.classList.remove('dark-booth')
    }
  }, [isDarkBooth])

  const toggleDarkBooth = () => {
    const next = !isDarkBooth
    setIsDarkBooth(next)
    localStorage.setItem('forgeproof_dark_booth', next ? 'true' : 'false')
  }

  const toggleAudio = () => {
    const next = !isMuted
    setIsMutedState(next)
    setAudioMuted(next)
  }

  const officerName = officer?.full_name || officer?.officer_id || 'Inspector Rajesh Kumar'
  const dutyStation = officer?.duty_station || 'Terminal-3, IGI Airport (DEL)'
  const badgeNo = officer?.badge_number || officer?.officer_id || 'IND-BOI-8294'
  const rank = officer?.rank || 'Immigration Inspector'
  const clearanceLevel = officer?.clearance_level || 'LEVEL_3_SUPERVISOR'

  // Time formatters
  const localTimeStr = currentTime.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const utcHours = String(currentTime.getUTCHours()).padStart(2, '0')
  const utcMins = String(currentTime.getUTCMinutes()).padStart(2, '0')
  const utcSecs = String(currentTime.getUTCSeconds()).padStart(2, '0')
  const utcTimeStr = `${utcHours}:${utcMins}:${utcSecs} Z`

  const dateStr = currentTime.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const navLinks = [
    { id: 'overview', label: t('overview'), icon: LayoutDashboard },
    { id: 'capture', label: t('capture'), icon: ScanLine },
    { id: 'audit', label: t('audit'), icon: FileSearch },
    { id: 'readiness', label: t('readiness'), icon: Activity },
    { id: 'advisories', label: t('advisories'), icon: Radio },
  ]

  return (
    <div className={`min-h-screen flex flex-col bg-[#EDF2F7] text-[#1E293B] ${fontSize === 'large' ? 'text-base' : fontSize === 'xlarge' ? 'text-lg' : 'text-sm'}`}>
      
      {/* 1. National Tricolor Top Stripe */}
      <div className="tricolor-stripe" />

      {/* 2. Official Indian Government Utility Top Bar */}
      <header className="w-full bg-[#0A2540] text-slate-200 text-xs border-b border-slate-700/80">
        <div className="mx-auto max-w-[1520px] px-4 py-1.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Official Government Authority Tags */}
          <div className="flex items-center gap-2">
            <span className="text-xs">🇮🇳</span>
            <div className="flex items-center gap-2 font-semibold text-[11px] tracking-wider uppercase text-slate-300">
              <span className="font-bold text-white">{lang === 'hi' ? 'भारत सरकार' : 'GOVERNMENT OF INDIA'}</span>
              <span className="text-slate-500">|</span>
              <span className="hidden sm:inline">{lang === 'hi' ? 'गृह मंत्रालय' : 'MINISTRY OF HOME AFFAIRS'}</span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-amber-400 font-extrabold hidden md:inline">{lang === 'hi' ? 'आव्रजन ब्यूरो' : 'BUREAU OF IMMIGRATION'}</span>
            </div>
          </div>

          {/* Center/Right: Dual Clocks, Language Switcher, Accessibility Controls */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            {/* Dual Clocks */}
            <div className="hidden lg:flex items-center gap-3 bg-black/30 px-3 py-0.5 rounded border border-white/10 text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-amber-400" />
                <span className="text-slate-400">IST:</span>
                <strong className="text-white font-bold">{localTimeStr}</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1.5">
                <Globe2 size={12} className="text-emerald-400" />
                <span className="text-slate-400">ICAO ZULU:</span>
                <strong className="text-emerald-300 font-bold">{utcTimeStr}</strong>
              </span>
            </div>

            {/* Language Switcher: English (Default) | हिन्दी */}
            <div className="flex items-center bg-slate-900/90 rounded border border-slate-600 p-0.5 text-[10px] font-bold font-sans">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${lang === 'en' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'}`}
                title="Switch interface to English (Default)"
              >
                English
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${lang === 'hi' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'}`}
                title="Switch interface to Hindi (हिन्दी)"
              >
                हिन्दी
              </button>
            </div>

            {/* Accessibility: Font Size Adjuster */}
            <div className="hidden sm:flex items-center border border-slate-600 rounded overflow-hidden text-[10px] font-bold">
              <button 
                onClick={() => setFontSize('normal')} 
                className={`px-1.5 py-0.5 ${fontSize === 'normal' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title="Normal Font Size"
              >
                A-
              </button>
              <button 
                onClick={() => setFontSize('large')} 
                className={`px-1.5 py-0.5 ${fontSize === 'large' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title="Medium Font Size"
              >
                A
              </button>
              <button 
                onClick={() => setFontSize('xlarge')} 
                className={`px-1.5 py-0.5 ${fontSize === 'xlarge' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title="Large Font Size"
              >
                A+
              </button>
            </div>

            {/* Tactical Audio Alert Toggle */}
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition cursor-pointer text-[10px] font-sans font-bold ${
                isMuted 
                  ? 'border-rose-400 bg-rose-950/60 text-rose-300' 
                  : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMuted ? "Audio alerts are MUTED" : "Audio alerts are ACTIVE"}
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} className="text-emerald-400" />}
              <span className="hidden md:inline">{isMuted ? t('muted') : t('audio_on')}</span>
            </button>

            {/* Night Booth Inspection Mode */}
            <button
              onClick={toggleDarkBooth}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition cursor-pointer text-[10px] font-sans font-bold ${
                isDarkBooth 
                  ? 'border-amber-400 bg-amber-950/60 text-amber-300' 
                  : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="Toggle Dark Booth Mode for low-light checkpoints"
            >
              {isDarkBooth ? <Sun size={12} /> : <Moon size={12} />}
              <span className="hidden md:inline">{isDarkBooth ? t('day_mode') : t('dark_booth')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Government Emblem & Portal Banner */}
      <div className="w-full bg-white border-b-2 border-[#003366] shadow-xs">
        <div className="mx-auto max-w-[1520px] px-4 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: National Emblem & Department Title */}
          <div className="flex items-center gap-3.5 sm:gap-5">
            <AshokaEmblem className="h-14 sm:h-16 shrink-0" />
            
            <div className="border-l-2 border-slate-300 pl-3.5 sm:pl-4">
              <div className="text-[11px] sm:text-xs font-semibold text-[#003366] tracking-wide leading-tight">
                <span className="font-bold">{lang === 'hi' ? 'भारत सरकार' : 'GOVERNMENT OF INDIA'}</span>
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-700 tracking-wide leading-tight mt-0.5">
                <span className="font-bold">{lang === 'hi' ? 'गृह मंत्रालय' : 'MINISTRY OF HOME AFFAIRS'}</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-[#003366] font-gov-serif tracking-normal mt-0.5">
                {lang === 'hi' ? 'आव्रजन ब्यूरो' : 'BUREAU OF IMMIGRATION'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#003366] tracking-tight flex items-center gap-1.5 mt-0.5">
                <span className="font-black text-[#003366]">ForgeProof</span>
                <span className="text-slate-400">·</span>
                <span className="font-normal text-slate-600 text-xs hidden sm:inline">
                  {t('system_desc')}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Authenticated Officer Identity Card */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 rounded p-2.5 shadow-2xs">
            <div className="size-10 rounded bg-[#003366] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs font-gov-sans">
              {officerName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') || 'OI'}
            </div>
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-xs text-[#003366] truncate">{officerName.toUpperCase()}</p>
                <span className="size-2 rounded-full bg-emerald-600 shrink-0" title="Active Duty" />
              </div>
              <p className="text-[10px] font-gov-mono text-slate-600 font-semibold truncate">
                BADGE: <strong className="text-slate-900">{badgeNo}</strong> · {clearanceLevel.replace('LEVEL_', 'LVL ').replace('_', ' ')}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                <MapPin size={10} className="text-slate-400 shrink-0" /> {dutyStation}
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="ml-2 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-[#D30B0D] px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer active:scale-95"
              title="Sign Out Session"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">{t('sign_out')}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. Full-Width Government Navigation Bar */}
      <nav className="w-full bg-[#003366] text-white shadow-md sticky top-0 z-40">
        <div className="mx-auto max-w-[1520px] px-2 flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center">
            {navLinks.map(({ id, label, icon: Icon }) => {
              const active = activePage === id
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-xs font-bold border-r border-[#002244] transition-colors whitespace-nowrap cursor-pointer ${
                    active 
                      ? 'bg-[#002244] text-[#D4AF37] border-b-4 border-b-[#D4AF37]' 
                      : 'text-slate-200 hover:bg-[#002850] hover:text-white border-b-4 border-b-transparent'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-[#D4AF37]' : 'text-slate-300'} />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-300 pr-3">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NIC SECURE NETWORK · {dateStr}</span>
          </div>
        </div>
      </nav>

      {/* 5. Government Breadcrumbs Bar */}
      <div className="w-full bg-[#E2E8F0] border-b border-slate-300 text-xs text-slate-600 py-1.5 px-4 sm:px-6">
        <div className="mx-auto max-w-[1520px] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="font-bold text-[#003366]">{t('home')}</span>
            <span>&gt;</span>
            <span className="text-slate-700">{t('border_desk')}</span>
            <span>&gt;</span>
            <span className="font-bold text-[#003366] uppercase">
              {navLinks.find(n => n.id === activePage)?.label || 'Screening'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500">
            <span>BOI TERMINAL REF: <strong className="text-slate-800 font-mono">ICP-DEL-T3-04</strong></span>
          </div>
        </div>
      </div>

      {/* 6. Main Content Surface */}
      <main className="flex-1 w-full mx-auto max-w-[1520px] p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* 7. Official Indian Government Footer */}
      <footer className="w-full bg-[#1A202C] text-slate-300 text-xs border-t-4 border-[#003366] mt-auto">
        {/* Top Footer Section */}
        <div className="mx-auto max-w-[1520px] px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-slate-700 text-xs">
          
          <div className="space-y-2">
            <p className="font-black text-white uppercase text-sm flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" /> {lang === 'hi' ? 'आव्रजन ब्यूरो' : 'BUREAU OF IMMIGRATION'}
            </p>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {t('footer_agency_desc')}
            </p>
            <p className="font-mono text-[10px] text-amber-400 font-bold">
              VERSION: FORGEPROOF-SIH26-PROD-V2.4
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-white uppercase text-xs">Official Portal Links</p>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li><a href="https://www.india.gov.in" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition">National Portal of India (india.gov.in)</a></li>
              <li><a href="https://www.mha.gov.in" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition">Ministry of Home Affairs (mha.gov.in)</a></li>
              <li><a href="https://boi.gov.in" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition">Bureau of Immigration (boi.gov.in)</a></li>
              <li><a href="https://uidai.gov.in" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition">Unique Identification Authority of India (UIDAI)</a></li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-white uppercase text-xs">Security & Compliance</p>
            <div className="space-y-1 text-slate-400 text-[11px]">
              <p>✓ Digital Personal Data Protection (DPDP) Act 2023</p>
              <p>✓ Aadhaar Act 2016 (Statutory 12-Digit Masking)</p>
              <p>✓ ICAO Doc 9303 (7-3-1 Modular Checksums)</p>
              <p>✓ CERT-In Cyber Security Benchmark Compliant</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-white uppercase text-xs">Technical Support Cell</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Designed & Developed for <strong>Smart India Hackathon 2026 (SIH-2026)</strong>.
              Border Checkpoint Identity & Travel Document Screening.
            </p>
            <div className="inline-block bg-slate-800 text-emerald-400 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono">
              SYSTEM STATUS: 100% OPERATIONAL
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="mx-auto max-w-[1520px] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>
            {t('footer_managed')}
          </div>
          <div className="font-mono text-[10px]">
            Designed by Team ForgeProof · SIH 2026 Edition
          </div>
        </div>

        {/* National Tricolor Bottom Stripe */}
        <div className="tricolor-stripe" />
      </footer>

    </div>
  )
}
