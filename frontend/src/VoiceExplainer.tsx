import { useState, useCallback, useRef } from 'react';
import { BookOpen, Volume2, Square, Mic, Search, Lightbulb, GraduationCap, BarChart3, ShieldQuestion, FileText, Users, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { speak, stopSpeaking, supportsSpeech, supportsSpeechRecognition, createSpeechRecognition } from '@/lib/voice';
import { askAssistant } from '@/lib/api';

interface Concept {
  key: string;
  icon: typeof BookOpen;
}

interface ConceptData {
  title: string;
  analogy: string;
  detailed: string;
  analogyHi?: string;
}

const CONCEPTS: Concept[] = [
  { key: 'mutualFund', icon: BarChart3 },
  { key: 'sip', icon: GraduationCap },
  { key: 'volatility', icon: TrendingUp },
  { key: 'sebi', icon: ShieldQuestion },
  { key: 'scamTypes', icon: ShieldQuestion },
  { key: 'kyc', icon: FileText },
  { key: 'nominee', icon: Users },
];

const KEYWORD_MAP: Record<string, string> = {
  'mutual fund': 'mutualFund', 'mutual funds': 'mutualFund', 'mf': 'mutualFund',
  'sip': 'sip', 'systematic': 'sip',
  'volatil': 'volatility', 'up and down': 'volatility', 'fluctuat': 'volatility',
  'sebi': 'sebi', 'regulator': 'sebi',
  'scam': 'scamTypes', 'fraud': 'scamTypes', 'phishing': 'scamTypes', 'ghotala': 'scamTypes',
  'kyc': 'kyc',
  'nominee': 'nominee', 'nomination': 'nominee',
  'पीजा': 'mutualFund', 'म्यूचुअल': 'mutualFund', 'फंड': 'mutualFund',
  'घोटाला': 'scamTypes', 'स्कैम': 'scamTypes',
};

function findConcept(query: string): string | null {
  const lower = query.toLowerCase().trim();
  for (const [keyword, concept] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return concept;
  }
  return null;
}

function extractConceptData(obj: Record<string, unknown> | null): ConceptData | null {
  if (!obj) return null;
  const title = typeof obj.title === 'string' ? obj.title : '';
  const analogy = typeof obj.analogy === 'string' ? obj.analogy : '';
  const detailed = typeof obj.detailed === 'string' ? obj.detailed : '';
  const analogyHi = typeof obj.analogyHi === 'string' ? obj.analogyHi : undefined;
  if (!title && !analogy && !detailed) return null;
  return { title, analogy, detailed, analogyHi };
}

export function VoiceExplainer() {
  const { t, tObject, lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSpeaking, setIsSpeakingState] = useState(false);
  const [isListening, setIsListeningState] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleAsk = useCallback(async (textToAsk?: string | unknown) => {
    const q = (typeof textToAsk === 'string' ? textToAsk : query).trim();
    if (!q) return;

    setLoadingAI(true);
    setAiAnswer(null);
    stopSpeaking();
    setIsSpeakingState(false);

    const concept = findConcept(q);
    setActiveConcept(concept);

    try {
      const res = await askAssistant(q, lang);
      setAiAnswer(res.answer);
    } catch {
      // ignore
    } finally {
      setLoadingAI(false);
    }
  }, [query, lang]);

  const handleConceptClick = useCallback((key: string) => {
    setActiveConcept(key);
    setQuery('');
    setAiAnswer(null);
    stopSpeaking();
    setIsSpeakingState(false);
  }, []);

  const handleSpeak = useCallback(
    (text: string) => {
      if (!supportsSpeech()) return;
      if (isSpeaking) {
        stopSpeaking();
        setIsSpeakingState(false);
        return;
      }
      speak(text, lang);
      setIsSpeakingState(true);
      setTimeout(() => setIsSpeakingState(false), text.length * 80 + 2000);
    },
    [lang, isSpeaking]
  );

  const handleVoiceInput = useCallback(() => {
    if (!supportsSpeechRecognition()) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListeningState(false);
      return;
    }

    const recognition = createSpeechRecognition(lang);
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleAsk(transcript);
    };
    recognition.onerror = () => setIsListeningState(false);
    recognition.onend = () => setIsListeningState(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListeningState(true);
  }, [lang, isListening, handleAsk]);

  const conceptData = extractConceptData(
    activeConcept ? tObject(`learn.concepts.${activeConcept}`) : null
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-600" strokeWidth={2} />
          </div>
          <div>
            <h2 className={`text-lg font-bold text-gray-900 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('learn.title')}
            </h2>
            <p className={`text-xs text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('learn.subtitle')}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder={t('learn.searchPlaceholder')}
              className={`w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm text-gray-800 placeholder:text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}
              aria-label={t('learn.searchPlaceholder')}
            />
          </div>
          {supportsSpeechRecognition() && (
            <button
              onClick={handleVoiceInput}
              className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
                isListening
                  ? 'bg-error-100 text-error-600 border-2 border-error-300 animate-pulse'
                  : 'bg-primary-50 text-primary-600 border-2 border-primary-200 hover:bg-primary-100'
              }`}
              aria-label={t('learn.speakBtn')}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleAsk}
            disabled={!query.trim()}
            className={`px-5 rounded-xl font-medium text-white transition-all ${
              query.trim()
                ? 'bg-primary-600 hover:bg-primary-700'
                : 'bg-gray-300 cursor-not-allowed'
            } ${lang === 'hi' ? 'font-hi' : ''}`}
          >
            {t('learn.askBtn')}
          </button>
        </div>

        {isListening && (
          <p className={`mt-2 text-xs text-error-600 font-medium flex items-center gap-1.5 ${lang === 'hi' ? 'font-hi' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-error-500 animate-pulse" />
            {t('learn.listening')}
          </p>
        )}
      </div>

      {/* Topic cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className={`text-sm font-bold text-gray-800 mb-3 ${lang === 'hi' ? 'font-hi' : ''}`}>
          {t('learn.categories')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CONCEPTS.map((concept) => {
            const Icon = concept.icon;
            const isActive = activeConcept === concept.key;
            return (
              <button
                key={concept.key}
                onClick={() => handleConceptClick(concept.key)}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-primary-200 hover:bg-primary-50'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className={`text-xs font-medium text-center leading-tight ${lang === 'hi' ? 'font-hi' : ''}`}>
                  {t(`learn.concepts.${concept.key}.title`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading AI response */}
      {loadingAI && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center gap-3 animate-fade-in">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm text-gray-600 font-medium ${lang === 'hi' ? 'font-hi' : ''}`}>
            {lang === 'hi' ? 'उत्तर प्राप्त हो रहा है...' : 'Fetching answer...'}
          </p>
        </div>
      )}

      {/* AI Assistant Answer */}
      {aiAnswer && !loadingAI && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-slide-up">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className={`text-base font-bold text-gray-900 pt-1.5 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {query || (lang === 'hi' ? 'संज्ञान सहायक का उत्तर' : 'SANGYAN Assistant Response')}
              </h3>
            </div>
            {supportsSpeech() && (
              <button
                onClick={() => handleSpeak(aiAnswer)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium shrink-0 transition-all ${
                  isSpeaking
                    ? 'bg-error-50 text-error-600 border border-error-200'
                    : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                }`}
              >
                {isSpeaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isSpeaking ? t('verify.stopVoice') : t('learn.voiceBtn')}
              </button>
            )}
          </div>
          <div className={`p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 leading-relaxed whitespace-pre-line ${lang === 'hi' ? 'font-hi' : ''}`}>
            {aiAnswer}
          </div>
        </div>
      )}

      {/* Concept explanation */}
      {conceptData && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-accent-600" />
              </div>
              <h3 className={`text-lg font-bold text-gray-900 pt-1.5 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {conceptData.title}
              </h3>
            </div>
            {supportsSpeech() && (
              <button
                onClick={() => handleSpeak(lang === 'hi' ? `${conceptData.title}. ${conceptData.analogyHi || conceptData.analogy}` : `${conceptData.title}. ${conceptData.analogy}`)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium shrink-0 transition-all ${
                  isSpeaking
                    ? 'bg-error-50 text-error-600 border border-error-200'
                    : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                }`}
              >
                {isSpeaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isSpeaking ? t('verify.stopVoice') : t('learn.voiceBtn')}
              </button>
            )}
          </div>

          {/* Analogy */}
          <div className="mt-4 p-4 rounded-xl bg-accent-50 border border-accent-100">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-accent-600" />
              <h4 className={`text-xs font-semibold text-accent-700 uppercase tracking-wide ${lang === 'hi' ? 'font-hi' : ''}`}>
                {lang === 'hi' ? 'सरल उदाहरण' : 'Simple Analogy'}
              </h4>
            </div>
            <p className={`text-sm text-gray-700 leading-relaxed ${lang === 'hi' ? 'font-hi' : ''}`}>
              {lang === 'hi' ? (conceptData.analogyHi || conceptData.analogy) : conceptData.analogy}
            </p>
          </div>

          {/* Detailed explanation */}
          <div className="mt-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className={`text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {lang === 'hi' ? 'विस्तृत व्याख्या' : 'Detailed Explanation'}
            </h4>
            <p className={`text-sm text-gray-700 leading-relaxed ${lang === 'hi' ? 'font-hi' : ''}`}>
              {conceptData.detailed}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mt-3">
            <p className={`text-xs text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('learn.disclaimer')}
            </p>
          </div>
        </div>
      )}

      {/* No result */}
      {activeConcept === null && query.trim() && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center animate-fade-in">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className={`text-sm text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('learn.noResult')}
          </p>
        </div>
      )}
    </div>
  );
}
