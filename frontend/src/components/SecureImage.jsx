import { useState, useEffect } from 'react'
import { Loader2, ImageOff } from 'lucide-react'

// Module-level in-memory cache to prevent refetching during view/tab switching
const blobCache = new Map()

export default function SecureImage({
  src,
  alt = 'Forensic Scan',
  className = '',
  containerClassName = '',
  fallback = null,
  ...props
}) {
  const [blobUrl, setBlobUrl] = useState(() => (src && blobCache.has(src) ? blobCache.get(src) : ''))
  const [isLoading, setIsLoading] = useState(() => Boolean(src && !blobCache.has(src) && !src.startsWith('data:') && !src.startsWith('blob:')))
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!src) {
      setBlobUrl('')
      setIsLoading(false)
      setHasError(false)
      return
    }

    // Already cached in memory
    if (blobCache.has(src)) {
      setBlobUrl(blobCache.get(src))
      setIsLoading(false)
      setHasError(false)
      return
    }

    // Direct data or blob URLs do not require header bypass
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setBlobUrl(src)
      setIsLoading(false)
      setHasError(false)
      return
    }

    let isSubscribed = true
    setIsLoading(true)
    setHasError(false)

    // Using global fetch which automatically applies 'ngrok-skip-browser-warning': 'true'
    fetch(src)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('text/html')) {
          throw new Error('Received HTML interstitial warning instead of image binary')
        }
        return res.blob()
      })
      .then(blob => {
        if (!isSubscribed) return
        const url = URL.createObjectURL(blob)
        blobCache.set(src, url)
        setBlobUrl(url)
        setIsLoading(false)
      })
      .catch(err => {
        console.warn('SecureImage fetch error, falling back to direct URL:', err)
        if (isSubscribed) {
          setBlobUrl(src)
          setIsLoading(false)
        }
      })

    return () => {
      isSubscribed = false
    }
  }, [src])

  if (isLoading) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-950/80 text-amber-400 gap-2 ${containerClassName}`}>
        <Loader2 className="size-7 animate-spin" />
        <span className="text-[11px] font-mono text-slate-400 tracking-wider">RETRIEVING FORENSIC SCAN...</span>
      </div>
    )
  }

  if (hasError) {
    return fallback || (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 gap-2 p-4 text-center ${containerClassName}`}>
        <ImageOff className="size-8 opacity-40 text-rose-400" />
        <span className="text-xs font-semibold text-slate-400 font-mono">{alt || 'Scan Asset Unavailable'}</span>
        <span className="text-[10px] text-slate-600">Ensure the backend host and tunnel are active</span>
      </div>
    )
  }

  return (
    <img
      src={blobUrl || src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  )
}
