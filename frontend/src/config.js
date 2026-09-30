// In local development (npm run dev), leaving it empty uses the Vite dev proxy (http://127.0.0.1:8000).
// In production (e.g. Vercel deployment), if VITE_API_URL is not set, default to the permanent ngrok tunnel.
const defaultProductionApi = 'https://truce-stride-veal.ngrok-free.dev'

function normalizeApiUrl(url) {
  if (!url) return ''
  url = url.trim().replace(/\/+$/, '')
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }
  return url
}

const rawApi = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : defaultProductionApi)

export const API_BASE = normalizeApiUrl(rawApi)

// Automatically bypass ngrok free tier browser warning and inject officer Bearer token
if (typeof window !== 'undefined' && !window.__forgeproofFetchPatched) {
  window.__forgeproofFetchPatched = true
  const originalFetch = window.fetch
  window.fetch = function (input, init = {}) {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '')
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}))

    // 1. Ngrok free tier browser warning bypass
    if (url.includes('ngrok') || (API_BASE && url.includes(API_BASE))) {
      if (!headers.has('ngrok-skip-browser-warning')) {
        headers.set('ngrok-skip-browser-warning', 'true')
      }
    }

    // 2. Global Bearer token injection for authenticated officer requests (QA C1/M1)
    const isApiRequest = url.includes('/api/v1/') || (API_BASE && url.startsWith(API_BASE))
    const isLoginEndpoint = url.includes('/api/v1/auth/login')
    if (isApiRequest && !isLoginEndpoint && !headers.has('Authorization')) {
      try {
        const token = sessionStorage.getItem('forgeproof_token') || localStorage.getItem('forgeproof_token')
        if (token) {
          headers.set('Authorization', `Bearer ${token}`)
        }
      } catch {
        // Ignore storage access restrictions
      }
    }

    return originalFetch(input, { ...init, headers })
  }
}
