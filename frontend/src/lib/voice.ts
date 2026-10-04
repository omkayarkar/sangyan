import type { Language } from '@/lib/types';

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string, lang: Language): void {
  if (!('speechSynthesis' in window)) return;

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  utterance.rate = 0.9;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const langCode = lang === 'hi' ? 'hi' : 'en';
  const matchingVoice = voices.find((v) => v.lang.startsWith(langCode));
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking;
}

export function supportsSpeech(): boolean {
  return 'speechSynthesis' in window;
}

export function supportsSpeechRecognition(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

export function createSpeechRecognition(lang: Language): SpeechRecognition | null {
  if (!supportsSpeechRecognition()) return null;

  const SR = (window as unknown as { SpeechRecognition: typeof SpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;

  const recognition = new SR();
  recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = false;
  return recognition;
}
