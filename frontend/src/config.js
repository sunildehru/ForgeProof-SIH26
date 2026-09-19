// ForgeProof API Configuration
// In production (e.g. Vercel), set VITE_API_URL to your deployed backend URL.
// In local development, leaving it empty uses the Vite dev proxy (http://127.0.0.1:8000).
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
