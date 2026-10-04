import { useState, useRef, useCallback } from 'react';
import { ShieldCheck, Mic, Square, Copy, Check, Sparkles, AlertCircle, Volume2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { simulateDelay } from '@/lib/scamDetector';
import { analyzeText } from '@/lib/api';
import { speak, stopSpeaking, supportsSpeech } from '@/lib/voice';
import type { VerificationResult, RedFlag, RiskLevel } from '@/lib/types';
import { RiskScoreBadge } from './RiskScoreBadge';
import { FlagList, EvidenceList } from './FlagList';

type LoadingStage = 'idle' | 'ocr' | 'redFlags' | 'registry' | 'reasoning' | 'done';

const STAGE_DELAYS: { stage: LoadingStage; ms: number }[] = [
  { stage: 'ocr', ms: 300 },
  { stage: 'redFlags', ms: 400 },
  { stage: 'registry', ms: 300 },
  { stage: 'reasoning', ms: 300 },
];

export function ScamVerifier() {
  const { t, lang } = useLanguage();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [stage, setStage] = useState<LoadingStage>('idle');
  const [isSpeaking, setIsSpeakingState] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const canAnalyze = input.trim().length >= 5 && stage === 'idle';

  const handleAnalyze = useCallback(async () => {
    if (input.trim().length < 5) return;
    setError(null);
    setResult(null);
    stopSpeaking();
    setIsSpeakingState(false);

    setStage('ocr');
    await simulateDelay(200);
    setStage('redFlags');

    try {
      const response = await analyzeText(input, lang);
      setStage('registry');
      await simulateDelay(200);
      setStage('reasoning');

      const riskLevel = response.risk_level.toLowerCase() as RiskLevel;
      const flags: RedFlag[] = response.red_flags.map((rf) => ({
        key: lang === 'hi' ? (rf.title_hi || rf.explanation_hi) : (rf.title_en || rf.explanation_en),
        severity: (rf.severity.toLowerCase() === 'critical' ? 'critical' : rf.severity.toLowerCase() === 'high' ? 'high' : 'medium'),
        weight: rf.severity.toLowerCase() === 'critical' ? 30 : rf.severity.toLowerCase() === 'high' ? 20 : 10,
      }));

      const evidence: string[] = [];
      const summaryText = lang === 'hi' ? response.summary_hi : response.summary_en;
      if (summaryText) {
        evidence.push(summaryText);
      }
      response.claims_to_verify.forEach((c) => {
        evidence.push(`${lang === 'hi' ? 'सत्यापित करने योग्य दावा' : 'Claim to verify'}: ${c.claim_text} (${lang === 'hi' ? c.reason_hi : c.reason_en})`);
      });
      response.safe_next_steps.forEach((s) => {
        evidence.push(`${lang === 'hi' ? 'सुरक्षित कदम' : 'Safe Step'}: ${lang === 'hi' ? s.step_hi : s.step_en}`);
      });

      setResult({
        riskLevel,
        riskScore: response.risk_score,
        confidence: Math.min(80 + flags.length * 5, 98),
        flags,
        sebiRegFound: null,
        sebiRegNumber: null,
        evidence,
      });
      setStage('done');
    } catch {
      setError(t('common.error'));
      setStage('idle');
    }
  }, [input, lang, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    setStage('idle');
    setError(null);
    stopSpeaking();
    setIsSpeakingState(false);
  }, []);

  const handleSample = useCallback(
    (sampleKey: string) => {
      const sample = t(`verify.${sampleKey}`);
      setInput(sample);
      setResult(null);
      setStage('idle');
    },
    [t]
  );

  const handleSpeak = useCallback(() => {
    if (!result || !supportsSpeech()) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeakingState(false);
      return;
    }

    const levelText = t(`verify.riskLevel.${result.riskLevel}`);
    const flagTexts = result.flags
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((f) => t(`verify.redFlags.${f.key}`));

    const spoken =
      lang === 'hi'
        ? `जोखिम स्तर: ${levelText}। स्कोर: ${result.riskScore} में से 100। ${flagTexts.length > 0 ? `मुख्य कारण: ${flagTexts.join('. ')}` : t('verify.noRiskFound')}`
        : `Risk level: ${levelText}. Score: ${result.riskScore} out of 100. ${flagTexts.length > 0 ? `Key reasons: ${flagTexts.join('. ')}` : t('verify.noRiskFound')}`;

    speak(spoken, lang);
    setIsSpeakingState(true);

    setTimeout(() => setIsSpeakingState(false), spoken.length * 80 + 2000);
  }, [result, lang, t, isSpeaking]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    const text = [
      `${t('verify.resultTitle')}: ${t(`verify.riskLevel.${result.riskLevel}`)}`,
      `Score: ${result.riskScore}/100`,
      `Confidence: ${result.confidence}%`,
      '',
      t('verify.reasonsFound'),
      ...result.flags.map((f) => `- ${t(`verify.redFlags.${f.key}`)}`),
      '',
      result.evidence.length > 0 ? t('verify.evidence') : '',
      ...result.evidence,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result, t]);

  const isLoading = stage !== 'idle' && stage !== 'done';
  const loadingStageText =
    stage === 'ocr' ? t('verify.loadingOCR')
    : stage === 'redFlags' ? t('verify.loadingRedFlags')
    : stage === 'registry' ? t('verify.loadingRegistry')
    : stage === 'reasoning' ? t('verify.loadingReasoning')
    : '';

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-600" strokeWidth={2} />
          </div>
          <div>
            <h2 className={`text-lg font-bold text-gray-900 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('verify.title')}
            </h2>
            <p className={`text-xs text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('verify.subtitle')}
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="mt-4">
          <textarea
            ref={textAreaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('verify.inputPlaceholder')}
            rows={5}
            disabled={isLoading}
            className={`w-full p-4 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm text-gray-800 resize-none placeholder:text-gray-400 disabled:bg-gray-50 ${lang === 'hi' ? 'font-hi' : ''}`}
            aria-label={t('verify.subtitle')}
          />
        </div>

        {/* Samples */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className={`text-xs text-gray-400 flex items-center gap-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {t('verify.sampleMsg')}:
          </span>
          {['sample1', 'sample2', 'sample3', 'sample4'].map((s) => (
            <button
              key={s}
              onClick={() => handleSample(s)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1.5 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors disabled:opacity-50 font-medium"
            >
              {s === 'sample1' ? 'SEBI 30%' : s === 'sample2' ? 'KYC' : s === 'sample3' ? '₹50k' : 'SIP'}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all ${
              canAnalyze
                ? 'bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-200 active:scale-[0.98]'
                : 'bg-gray-300 cursor-not-allowed'
            } ${lang === 'hi' ? 'font-hi' : ''}`}
          >
            <ShieldCheck className="w-5 h-5" />
            {isLoading ? t('verify.analyzing') : t('verify.analyzeBtn')}
          </button>
          <button
            onClick={handleClear}
            disabled={isLoading}
            className={`px-5 py-3.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 ${lang === 'hi' ? 'font-hi' : ''}`}
          >
            {t('verify.clearBtn')}
          </button>
        </div>

        {/* Privacy badge */}
        <div className="mt-3 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-success-500" />
          <p className={`text-xs text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('verify.offlineMsg')}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-3 border-primary-200" />
              <div className="absolute inset-0 w-14 h-14 rounded-full border-3 border-primary-500 border-t-transparent animate-spin" />
              <ShieldCheck className="absolute inset-0 m-auto w-6 h-6 text-primary-500" />
            </div>
            <p className={`text-sm text-gray-600 font-medium ${lang === 'hi' ? 'font-hi' : ''}`}>
              {loadingStageText}
            </p>
            <div className="w-full max-w-xs space-y-1.5">
              {['ocr', 'redFlags', 'registry', 'reasoning'].map((s, i) => {
                const stageOrder = ['ocr', 'redFlags', 'registry', 'reasoning'];
                const currentIdx = stageOrder.indexOf(stage);
                const isDone = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                        isDone ? 'bg-success-500 text-white' : isCurrent ? 'bg-primary-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs ${isDone || isCurrent ? 'text-gray-700' : 'text-gray-400'} ${lang === 'hi' ? 'font-hi' : ''}`}>
                      {t(`verify.loading${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-error-50 border border-error-200 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-error-600 shrink-0" />
          <p className={`text-sm text-error-700 ${lang === 'hi' ? 'font-hi' : ''}`}>{error}</p>
        </div>
      )}

      {/* Results */}
      {result && stage === 'done' && (
        <div className="space-y-4 animate-fade-in">
          <RiskScoreBadge level={result.riskLevel} score={result.riskScore} confidence={result.confidence} />

          {/* SEBI Reg info */}
          {result.sebiRegNumber && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                result.sebiRegFound
                  ? 'bg-success-50 border-success-200'
                  : 'bg-error-50 border-error-200'
              }`}
            >
              <ShieldCheck
                className={`w-5 h-5 shrink-0 mt-0.5 ${result.sebiRegFound ? 'text-success-600' : 'text-error-600'}`}
              />
              <div>
                <p className={`text-xs text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
                  {t('verify.regNumberDetected')}: {result.sebiRegNumber}
                </p>
                <p
                  className={`text-sm font-semibold ${result.sebiRegFound ? 'text-success-700' : 'text-error-700'} ${lang === 'hi' ? 'font-hi' : ''}`}
                >
                  {result.sebiRegFound ? t('verify.regNumberValid') : t('verify.regNumberInvalid')}
                </p>
              </div>
            </div>
          )}

          {/* Reasons */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className={`text-sm font-bold text-gray-800 mb-3 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('verify.reasonsFound')}
            </h3>
            <FlagList flags={result.flags} />
            <EvidenceList evidence={result.evidence} />
          </div>

          {/* Voice + Copy actions */}
          <div className="flex gap-3">
            {supportsSpeech() && (
              <button
                onClick={handleSpeak}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  isSpeaking
                    ? 'bg-error-50 text-error-600 border border-error-200'
                    : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                } ${lang === 'hi' ? 'font-hi' : ''}`}
              >
                {isSpeaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isSpeaking ? t('verify.stopVoice') : t('verify.voiceBtn')}
              </button>
            )}
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-all ${lang === 'hi' ? 'font-hi' : ''}`}
            >
              {copied ? <Check className="w-4 h-4 text-success-600" /> : <Copy className="w-4 h-4" />}
              {copied ? t('verify.resultCopied') : t('verify.copyResult')}
            </button>
          </div>

          {/* Disclaimer */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <p className={`text-xs text-gray-500 leading-relaxed ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('verify.disclaimer')}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !isLoading && !error && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-8 h-8 text-gray-300" />
          </div>
          <p className={`text-sm text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('verify.emptyState')}
          </p>
        </div>
      )}
    </div>
  );
}
