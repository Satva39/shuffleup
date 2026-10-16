let audioContext = null;
let masterGain = null;
let enabled = false;
let musicEnabled = false;
let volume = 0.35;
let musicTimer = null;
let lastSoundAt = new Map();

function getContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) {
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

export function isSoundEnabled() {
  return enabled;
}
export function isMusicEnabled() {
  return musicEnabled;
}
export function getSoundVolume() {
  return volume;
}

export async function setSoundEnabled(nextValue) {
  enabled = Boolean(nextValue);
  if (enabled) {
    const context = getContext();
    if (context?.state === "suspended") await context.resume();
    playGameSound("tap", true);
  }
  return enabled;
}

export async function setMusicEnabled(nextValue) {
  musicEnabled = Boolean(nextValue);
  if (!musicEnabled) {
    if (musicTimer) clearTimeout(musicTimer);
    musicTimer = null;
    return false;
  }
  const context = getContext();
  if (context?.state === "suspended") await context.resume();
  scheduleMusicPhrase();
  return true;
}

export function setSoundVolume(nextValue) {
  const number = Number(nextValue);
  if (!Number.isFinite(number)) return volume;
  volume = Math.max(0, Math.min(1, number));
  if (masterGain && audioContext)
    masterGain.gain.setTargetAtTime(volume, audioContext.currentTime, 0.02);
  return volume;
}

function tone(
  frequency,
  startAt,
  duration,
  { type = "sine", gain = 0.18, endFrequency = null } = {},
) {
  const context = getContext();
  if (!context || !masterGain) return;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(30, frequency), startAt);
  if (endFrequency)
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(30, endFrequency),
      startAt + duration,
    );
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(
    Math.max(0.001, gain),
    startAt + Math.min(0.015, duration / 3),
  );
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(envelope);
  envelope.connect(masterGain);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.025);
}

export function playGameSound(kind = "card", force = false) {
  if (!enabled && !force) return;
  const context = getContext();
  if (!context) return;
  const now = context.currentTime;
  const previousAt = lastSoundAt.get(kind) || -Infinity;
  if (now - previousAt < 0.08) return;
  lastSoundAt.set(kind, now);

  if (kind === "draw") {
    tone(420, now, 0.12, { type: "triangle", gain: 0.16, endFrequency: 310 });
  } else if (kind === "trick") {
    tone(520, now, 0.16, { type: "sine", gain: 0.13 });
    tone(690, now + 0.1, 0.2, { type: "sine", gain: 0.12 });
  } else if (kind === "win") {
    [523.25, 659.25, 783.99].forEach((frequency, index) =>
      tone(frequency, now + index * 0.09, 0.28, { type: "sine", gain: 0.1 }),
    );
  } else if (kind === "tap") {
    tone(620, now, 0.06, { type: "sine", gain: 0.06, endFrequency: 520 });
  } else {
    // Soft, short card flick sound built from oscillators; no external assets.
    tone(460, now, 0.085, { type: "triangle", gain: 0.14, endFrequency: 230 });
    tone(880, now + 0.018, 0.045, {
      type: "sine",
      gain: 0.035,
      endFrequency: 620,
    });
  }
}

function scheduleMusicPhrase() {
  if (!musicEnabled) return;
  const context = getContext();
  if (!context) return;
  const now = context.currentTime;
  // Low-volume, original synthesized ambient triad. It begins only after the
  // user explicitly enables music, respecting browser autoplay policies.
  [130.81, 164.81, 196.0].forEach((frequency, index) => {
    tone(frequency, now + index * 0.12, 2.6, { type: "triangle", gain: 0.015 });
  });
  musicTimer = setTimeout(scheduleMusicPhrase, 4200);
}
