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

// Automatically bypass ngrok free tier browser warning on all fetch requests
if (typeof window !== 'undefined' && !window.__ngrokFetchPatched) {
  window.__ngrokFetchPatched = true
  const originalFetch = window.fetch
  window.fetch = function (input, init = {}) {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '')
    if (url.includes('ngrok') || (API_BASE && url.includes(API_BASE))) {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}))
      if (!headers.has('ngrok-skip-browser-warning')) {
        headers.set('ngrok-skip-browser-warning', 'true')
      }
      return originalFetch(input, { ...init, headers })
    }
    return originalFetch(input, init)
  }
}
