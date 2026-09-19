import { useState, useEffect } from 'react'
import { API_BASE } from './config'
import LoginPage from './pages/LoginPage'
import PortalShell from './components/PortalShell'
import OverviewPage from './pages/OverviewPage'
import CaptureStationPage from './pages/CaptureStationPage'
import CaseDetailPage from './pages/CaseDetailPage'
import AuditPage from './pages/AuditPage'
import SystemReadinessPage from './pages/SystemReadinessPage'
import AdvisoriesPage from './pages/AdvisoriesPage'

import { LanguageProvider } from './utils/LanguageContext'

export default function App() {
  const [officer, setOfficer] = useState(() => {
    try {
      const saved = localStorage.getItem('forgeproof_officer')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('forgeproof_token') || null)
  const [activePage, setActivePage] = useState('overview') // overview, capture, audit, case_detail
  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState(null)

  // Fetch queue
  const fetchCases = () => {
    fetch(`${API_BASE}/api/v1/cases`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch cases')
        return res.json()
      })
      .then(data => setCases(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Case queue fetch error:', err)
        setCases([])
      })
  }

  useEffect(() => {
    if (officer && (activePage === 'overview' || activePage === 'cases')) {
      fetchCases()
      const interval = setInterval(fetchCases, 5000)
      return () => clearInterval(interval)
    }
  }, [officer, activePage])

  const handleLogin = (officerData, sessionToken) => {
    setOfficer(officerData)
    setToken(sessionToken)
    try {
      localStorage.setItem('forgeproof_officer', JSON.stringify(officerData))
      if (sessionToken) localStorage.setItem('forgeproof_token', sessionToken)
    } catch (e) {
      console.warn('Storage error:', e)
    }
    setActivePage('overview')
  }

  const handleLogout = () => {
    if (token) {
      fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {})
    }
    setOfficer(null)
    setToken(null)
    localStorage.removeItem('forgeproof_officer')
    localStorage.removeItem('forgeproof_token')
    setActivePage('overview')
  }

  const handleNavigate = (pageId) => {
    setActivePage(pageId)
    if (pageId !== 'case_detail') {
      setSelectedCaseId(null)
    }
  }

  const handleViewCase = (id) => {
    setSelectedCaseId(id)
    setActivePage('case_detail')
  }

  const handleCaptureComplete = (id) => {
    setSelectedCaseId(id)
    setActivePage('case_detail')
    fetchCases()
  }

  if (!officer) {
    return (
      <LanguageProvider>
        <LoginPage onLogin={handleLogin} />
      </LanguageProvider>
    )
  }

  return (
    <LanguageProvider>
      <PortalShell 
        activePage={activePage} 
        onNavigate={handleNavigate}
        officer={officer}
        onLogout={handleLogout}
      >
        {activePage === 'overview' && <OverviewPage cases={cases} onViewCase={handleViewCase} onNavigate={handleNavigate} />}
        {activePage === 'capture' && <CaptureStationPage onComplete={handleCaptureComplete} onCancel={() => handleNavigate('overview')} />}
        {activePage === 'case_detail' && <CaseDetailPage caseId={selectedCaseId} officer={officer} onBack={() => handleNavigate('overview')} />}
        {activePage === 'audit' && <AuditPage />}
        {activePage === 'readiness' && <SystemReadinessPage onNavigate={handleNavigate} />}
        {activePage === 'advisories' && <AdvisoriesPage />}
      </PortalShell>
    </LanguageProvider>
  )
}
