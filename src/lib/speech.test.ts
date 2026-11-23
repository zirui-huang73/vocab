import { describe, expect, it } from 'vitest';
import { pickVoice, rankVoices, voiceQuality } from './speech';

const v = (name: string, voiceURI: string, lang = 'en-US', localService = true) =>
  ({ name, voiceURI, lang, localService, default: false }) as SpeechSynthesisVoice;

const zarvox = v('Zarvox', 'com.apple.speech.synthesis.voice.Zarvox');
const grandpa = v('Grandpa (English (US))', 'com.apple.eloquence.en-US.Grandpa');
const albert = v('Albert', 'com.apple.speech.synthesis.voice.Albert');
const samantha = v('Samantha', 'com.apple.voice.compact.en-US.Samantha');
const avaEnhanced = v('Ava (Enhanced)', 'com.apple.voice.enhanced.en-US.Ava');
const zoePremium = v('Zoe', 'com.apple.voice.premium.en-US.Zoe');
const daniel = v('Daniel', 'com.apple.voice.compact.en-GB.Daniel', 'en-GB');
const google = v('Google US English', 'Google US English', 'en-US', false);

describe('voiceQuality', () => {
  it('reads premium and enhanced from the voice URI or name', () => {
    expect(voiceQuality(zoePremium)).toBe('premium');
    expect(voiceQuality(avaEnhanced)).toBe('enhanced');
    expect(voiceQuality(samantha)).toBe('standard');
  });
});

describe('rankVoices', () => {
  it('drops novelty and Eloquence voices and non-US voices', () => {
    expect(rankVoices([zarvox, grandpa, albert, daniel, samantha])).toEqual([samantha]);
  });

  it('puts better quality first', () => {
    expect(rankVoices([samantha, avaEnhanced, zoePremium, google])).toEqual([zoePremium, avaEnhanced, google, samantha]);
  });

  it('accepts underscore language tags', () => {
    expect(rankVoices([v('Samantha', 'x', 'en_US')])).toHaveLength(1);
  });
});

describe('pickVoice', () => {
  const voices = [zarvox, samantha, avaEnhanced];

  it('uses the chosen voice when it is available', () => {
    expect(pickVoice(voices, samantha.voiceURI)).toBe(samantha);
  });

  it('falls back to the best voice when the choice is missing', () => {
    expect(pickVoice(voices, 'gone')).toBe(avaEnhanced);
    expect(pickVoice(voices, undefined)).toBe(avaEnhanced);
  });

  it('returns nothing when only novelty voices exist', () => {
    expect(pickVoice([zarvox, grandpa], undefined)).toBeUndefined();
  });
});
