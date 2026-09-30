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
  // Always present the Login Page on fresh visits & wipe any stale permanent localStorage credentials
  const [officer, setOfficer] = useState(() => {
    try {
      localStorage.removeItem('forgeproof_officer')
      localStorage.removeItem('forgeproof_token')
      sessionStorage.removeItem('forgeproof_officer')
      sessionStorage.removeItem('forgeproof_token')
    } catch {}
    return null
  })
  const [token, setToken] = useState(null)
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
      sessionStorage.setItem('forgeproof_officer', JSON.stringify(officerData))
      if (sessionToken) sessionStorage.setItem('forgeproof_token', sessionToken)
    } catch (e) {
      console.warn('Storage error:', e)
    }
    // Compromise safety: automatically reset the demo sandbox upon officer login
    fetch(`${API_BASE}/api/v1/system/reset-demo`, { method: 'POST' })
      .then(() => fetchCases())
      .catch(() => {})

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
    try {
      sessionStorage.removeItem('forgeproof_officer')
      sessionStorage.removeItem('forgeproof_token')
      localStorage.removeItem('forgeproof_officer')
      localStorage.removeItem('forgeproof_token')
    } catch {}
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
        {activePage === 'overview' && <OverviewPage cases={cases} onViewCase={handleViewCase} onNavigate={handleNavigate} onRefreshQueue={fetchCases} />}
        {activePage === 'capture' && <CaptureStationPage onComplete={handleCaptureComplete} onCancel={() => handleNavigate('overview')} />}
        {activePage === 'case_detail' && <CaseDetailPage caseId={selectedCaseId} officer={officer} onBack={() => handleNavigate('overview')} />}
        {activePage === 'audit' && <AuditPage />}
        {activePage === 'readiness' && <SystemReadinessPage onNavigate={handleNavigate} />}
        {activePage === 'advisories' && <AdvisoriesPage />}
      </PortalShell>
    </LanguageProvider>
  )
}
