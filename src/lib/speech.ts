export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

const PREFERRED = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Alex'];
let voice: SpeechSynthesisVoice | undefined;

function pickVoice() {
  const us = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase() === 'en-us');
  voice = PREFERRED.map((name) => us.find((v) => v.name.includes(name))).find(Boolean) ?? us.find((v) => v.localService) ?? us[0];
}

if (speechSupported) {
  pickVoice();
  speechSynthesis.addEventListener('voiceschanged', pickVoice);
}

export function hasUsVoice(): boolean {
  return speechSupported && voice !== undefined;
}

export function speak(text: string, rate = 0.9): void {
  if (!speechSupported) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
