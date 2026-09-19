/**
 * ForgeProof Tactical Audio Alert System
 * Synthesizes zero-latency acoustic chimes and alarms using the browser's native Web Audio API.
 * Requires 0 external audio files/downloads. Supports user mute toggle persisted in localStorage.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isAudioMuted() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('forgeproof_audio_muted') === 'true';
}

export function setAudioMuted(muted) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('forgeproof_audio_muted', muted ? 'true' : 'false');
}

/**
 * Ascending pleasant 3-note chime (C5 - E5 - G5) for Approved / Low-Risk clear verdict.
 */
export function playApprovalChime() {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

    gain.gain.setValueAtTime(0, now + idx * 0.12);
    gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.12);
    osc.stop(now + idx * 0.12 + 0.46);
  });
}

/**
 * Mid-frequency dual pulsing tone for Secondary Review / Warning.
 */
export function playWarningTone() {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  [0, 0.22].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now + offset); // A4

    gain.gain.setValueAtTime(0, now + offset);
    gain.gain.linearRampToValueAtTime(0.2, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + offset);
    osc.stop(now + offset + 0.19);
  });
}

/**
 * Low-frequency urgent alarm / klaxon for High Risk, Forgery, or Interpol Hits.
 */
export function playKlaxonAlarm() {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  [0, 0.25, 0.5].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now + offset);
    osc.frequency.linearRampToValueAtTime(140, now + offset + 0.2);

    gain.gain.setValueAtTime(0, now + offset);
    gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + offset);
    osc.stop(now + offset + 0.23);
  });
}

/**
 * Automatically triggers the corresponding acoustic alert based on risk tier and Interpol hit status.
 */
export function playVerdictAudio(riskLevel, isWatchlistHit = false) {
  if (isWatchlistHit || (riskLevel && riskLevel.toUpperCase() === 'HIGH')) {
    playKlaxonAlarm();
  } else if (riskLevel && riskLevel.toUpperCase() === 'MEDIUM') {
    playWarningTone();
  } else if (riskLevel && riskLevel.toUpperCase() === 'LOW') {
    playApprovalChime();
  }
}
