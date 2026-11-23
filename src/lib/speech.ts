export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export type VoiceQuality = 'premium' | 'enhanced' | 'standard';

// Apple's joke voices and the robotic Eloquence voices are listed as en-US but are unusable for learning.
const NOVELTY = new Set(
  'Albert,Bad News,Bahh,Bells,Boing,Bubbles,Cellos,Wobble,Fred,Good News,Jester,Junior,Kathy,Organ,Superstar,Ralph,Trinoids,Whisper,Zarvox,Eddy,Flo,Grandma,Grandpa,Reed,Rocko,Sandy,Shelley'.split(','),
);
const PREFERRED = ['Ava', 'Zoe', 'Evan', 'Nathan', 'Allison', 'Susan', 'Tom', 'Samantha', 'Alex', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny'];

export const baseName = (v: SpeechSynthesisVoice) => v.name.replace(/\s*\(.*\)$/, '');

export function voiceQuality(v: SpeechSynthesisVoice): VoiceQuality {
  const id = `${v.voiceURI} ${v.name}`;
  if (/premium/i.test(id)) return 'premium';
  if (/enhanced|natural/i.test(id)) return 'enhanced';
  return 'standard';
}

const SCORE: Record<VoiceQuality, number> = { premium: 3, enhanced: 2, standard: 0 };
const score = (v: SpeechSynthesisVoice) => SCORE[voiceQuality(v)] + (v.localService ? 0 : 1);
const prefIndex = (v: SpeechSynthesisVoice) => {
  const i = PREFERRED.findIndex((p) => v.name.startsWith(p));
  return i < 0 ? PREFERRED.length : i;
};

export function rankVoices(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices
    .filter((v) => v.lang.replace('_', '-').toLowerCase() === 'en-us' && !/eloquence/i.test(v.voiceURI) && !NOVELTY.has(baseName(v)))
    .sort((a, b) => score(b) - score(a) || prefIndex(a) - prefIndex(b));
}

export function pickVoice(voices: readonly SpeechSynthesisVoice[], preferredURI: string | undefined): SpeechSynthesisVoice | undefined {
  const ranked = rankVoices(voices);
  return ranked.find((v) => v.voiceURI === preferredURI) ?? ranked[0];
}

let voices: SpeechSynthesisVoice[] = [];
let preferredURI: string | undefined;
const listeners = new Set<() => void>();

function refresh() {
  voices = rankVoices(speechSynthesis.getVoices());
  listeners.forEach((l) => l());
}

if (speechSupported) {
  refresh();
  speechSynthesis.addEventListener('voiceschanged', refresh);
}

export function getVoices(): SpeechSynthesisVoice[] {
  return voices;
}

export function subscribeVoices(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPreferredVoice(uri: string | undefined): void {
  preferredURI = uri;
}

export function currentVoice(): SpeechSynthesisVoice | undefined {
  if (speechSupported && !voices.length) voices = rankVoices(speechSynthesis.getVoices());
  return pickVoice(voices, preferredURI);
}

const RATE = 0.75;
// Delay for automatic playback so it doesn't start while the card is re-rendering (iOS clips the start).
export const AUTOPLAY_DELAY = 300;
// iOS clips or speeds up an utterance that starts right after cancel().
const AFTER_CANCEL_GAP = 120;
let timer: ReturnType<typeof setTimeout> | undefined;

export function speak(text: string, delay = 0): () => void {
  if (!speechSupported) return () => {};
  clearTimeout(timer);
  const busy = speechSynthesis.speaking || speechSynthesis.pending;
  if (busy) speechSynthesis.cancel();
  const run = () => {
    const u = new SpeechSynthesisUtterance(text);
    const voice = currentVoice();
    u.lang = voice?.lang ?? 'en-US';
    u.rate = RATE;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  };
  const wait = Math.max(delay, busy ? AFTER_CANCEL_GAP : 0);
  if (!wait) {
    run();
    return () => {};
  }
  const t = setTimeout(run, wait);
  timer = t;
  return () => clearTimeout(t);
}
