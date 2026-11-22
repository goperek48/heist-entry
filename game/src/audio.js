// The Velvet Vault — synthesised sound.
// Every sound is built with the Web Audio API at run time: no audio files,
// no network, nothing to ship. Created lazily on the first user gesture so
// browsers allow it.
let ctx = null;
let master = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.35;
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  const c = ensure();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, vol, lowpass = 1200, when = 0) {
  const c = ensure();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = lowpass;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(filt);
  filt.connect(g);
  g.connect(master);
  src.start(t0);
}

export const sfx = {
  pickup() { tone(880, 0.12, 'sine', 0.5); tone(1318, 0.2, 'sine', 0.4, 0.09); },
  lockpick() { tone(1400, 0.05, 'square', 0.12); },
  unlock() { tone(523, 0.1, 'triangle', 0.4); tone(784, 0.16, 'triangle', 0.4, 0.08); },
  spotted() { tone(220, 0.35, 'sawtooth', 0.4, 0, 440); },
  alarm() { tone(660, 0.22, 'square', 0.28); tone(440, 0.22, 'square', 0.28, 0.22); },
  smoke() { noise(0.6, 0.5, 900); },
  emp() { tone(1800, 0.5, 'sawtooth', 0.25, 0, 120); noise(0.4, 0.3, 3000); },
  caught() { tone(330, 0.5, 'sawtooth', 0.45, 0, 110); tone(165, 0.7, 'sawtooth', 0.4, 0.25, 55); },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.45, i * 0.13));
    tone(1318, 0.5, 'triangle', 0.4, 0.55);
  },
  step() { noise(0.05, 0.06, 500); },
  click() { tone(1200, 0.04, 'square', 0.15); },
};
