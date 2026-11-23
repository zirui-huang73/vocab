import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Speech = typeof import('./speech');

function fakeSynth(speaking = false) {
  return {
    speaking,
    pending: false,
    getVoices: () => [],
    addEventListener: () => {},
    cancel: vi.fn(),
    speak: vi.fn(),
  };
}

let synth: ReturnType<typeof fakeSynth>;
let speech: Speech;

async function load(speaking = false) {
  synth = fakeSynth(speaking);
  vi.stubGlobal('window', { speechSynthesis: synth });
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} });
  vi.resetModules();
  speech = await import('./speech');
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('speak', () => {
  it('speaks immediately when idle and no delay is given', async () => {
    await load();
    speech.speak('apple');
    expect(synth.cancel).not.toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledOnce();
  });

  it('uses a slower rate than normal', async () => {
    await load();
    speech.speak('apple');
    expect(synth.speak.mock.calls[0][0].rate).toBeLessThan(0.9);
  });

  it('waits for the autoplay delay and can be cancelled', async () => {
    await load();
    const cancel = speech.speak('apple', speech.AUTOPLAY_DELAY);
    vi.advanceTimersByTime(speech.AUTOPLAY_DELAY - 1);
    expect(synth.speak).not.toHaveBeenCalled();
    cancel();
    vi.advanceTimersByTime(1000);
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('cancels current speech and leaves a gap before the next utterance', async () => {
    await load(true);
    speech.speak('apple');
    expect(synth.cancel).toHaveBeenCalledOnce();
    expect(synth.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(synth.speak).toHaveBeenCalledOnce();
  });

  it('a new call replaces a scheduled one', async () => {
    await load();
    speech.speak('apple', 300);
    speech.speak('banana', 300);
    vi.advanceTimersByTime(300);
    expect(synth.speak).toHaveBeenCalledOnce();
    expect(synth.speak.mock.calls[0][0].text).toBe('banana');
  });
});
