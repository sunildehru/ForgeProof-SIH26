# ForgeProof — CHANGELOG

All notable changes to the ForgeProof Forensic Identity Platform are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.1.0] — 2026-10-07

### Added
- `scripts/audit_integrity.py` — zero-dependency CI audit runner covering
  health telemetry, auth TTL, ledger integrity, OCR noise regression, and
  watchlist persona isolation (6 test suites, ~20 assertions).
- `docs/BUILD_OPTIMISATION.md` — Docker layer cache strategy, dependency
  version constraint table, and Azure App Service sizing reference.
- `docs/EVALUATION_GUIDE.md` — SIH 2026 evaluator walkthrough with all 7
  benchmark scenarios, expected forensic outputs, and scoring rubric.
- `docs/AZURE_DEPLOYMENT.md` — Azure Container Registry + App Service B1
  architecture diagram, container spec, and app settings reference.

### Changed
- **Health endpoint** (`GET /api/v1/health`): now returns `uptime_seconds`,
  `ledger_blocks`, and a `diagnostics` sub-object with avg response latency
  and OCR engine status.
- **Session TTL**: officer auth tokens now expire after 24 hours (`SESSION_TTL_SECONDS = 86400`).
  Stale tokens return `401 Unauthorized` with a clear error message.
- **Login gate**: frontend now clears stale `localStorage`/`sessionStorage`
  credentials on every page load, ensuring the login screen always appears
  for fresh browser sessions.
- **Sandbox reset**: `POST /api/v1/system/reset-demo` endpoint added; frontend
  "Reset Demo Sandbox" button triggers it on each evaluator login for a clean
  benchmark state.

### Fixed
- **OCR noise filter**: government header strings (e.g., `GOVERNMENT OF INDIA`,
  `INCOME TAX DEPT`) are now suppressed from subject-name extraction across
  all four document extractors (Aadhaar, PAN, Driving Licence, Passport).
- **Watchlist persona isolation**: Interpol Red Notice persona corrected to
  `VIKRAM SINGHANIA`; previous placeholder `ROHIT SHARMA` has been fully
  purged from the watchlist engine and pipeline references.
- **Officer fallback label**: case detail view now shows `Inspector Rajesh K. Verma`
  (badge `IND-SSB-8294`) instead of the generic `Officer ID` placeholder.
- **Camera fallback**: downgraded `console.error` to `console.info` for
  graceful camera-absent environments (evaluation laptops without webcams).
- **WCAG aria-label**: risk-level filter `<select>` element now carries
  `aria-label="Filter queue by risk level"` for screen-reader compliance.

### Security
- **Bearer token interceptor**: `window.fetch` is patched globally to inject
  `Authorization: Bearer <token>` on all API calls except `/auth/login`,
  eliminating unauthenticated API access that was flagged in the QA audit (C1).
- **Container isolation**: backend now runs in Azure Container Registry /
  App Service B1, replacing the ephemeral ngrok tunnel (QA finding C2).

---

## [1.0.0] — 2026-09-26

### Added
- Initial SIH 2026 submission build.
- ForgeProof vector emblem and SSB authority branding.
- FastAPI backend with TinyDB ledger, Tesseract OCR pipeline, and
  cryptographic hash chain for tamper-evident case records.
- React 19 + Vite + Tailwind CSS v4 frontend with liquid-glass design system.
- Watchlist cross-validation engine (Interpol, CCTNS, LOC integration stubs).
- Biometric liveness challenge module (camera + fingerprint fallback).
- `POST /api/v1/cases/screen` multipart endpoint for document + biometric intake.
- `GET /api/v1/cases/{case_id}` with full forensic timeline and officer decision.
- Preset scenario seeder (7 curated benchmark personas).

---

<!-- 
Versioning policy:
  MAJOR — breaking API changes
  MINOR — new features, backward-compatible
  PATCH — bug fixes, documentation, refactors
-->
