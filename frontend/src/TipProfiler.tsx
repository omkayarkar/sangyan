import { useState, useCallback } from 'react';
import { TrendingUp, AlertTriangle, Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { analyzeText } from '@/lib/api';
import type { TipProfileResult, RiskLevel } from '@/lib/types';
import { RiskScoreBadge } from './RiskScoreBadge';

const RECOMMENDATION_STYLES: Record<RiskLevel, string> = {
  low: 'bg-success-50 border-success-200 text-success-800',
  medium: 'bg-warning-50 border-warning-200 text-warning-800',
  high: 'bg-error-50 border-error-200 text-error-800',
  critical: 'bg-error-100 border-error-300 text-error-900',
};

export function TipProfiler() {
  const { t, lang } = useLanguage();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TipProfileResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = useCallback(async () => {
    if (input.trim().length < 5) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await analyzeText(input, lang);
      const riskLevel = response.risk_level.toLowerCase() as RiskLevel;
      const patterns = response.red_flags.map((rf) => ({
        key: rf.category,
        matched: true,
        description: lang === 'hi' ? (rf.title_hi || rf.explanation_hi) : (rf.title_en || rf.explanation_en),
      }));

      setResult({
        riskLevel,
        riskScore: response.risk_score,
        patternsMatched: patterns.length,
        totalPatterns: Math.max(patterns.length, 5),
        patterns,
      });
    } catch {
      // Keep loading false on error
    } finally {
      setLoading(false);
    }
  }, [input, lang]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
  }, []);

  const matchedPatterns = result?.patterns.filter((p) => p.matched) || [];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-600" strokeWidth={2} />
          </div>
          <div>
            <h2 className={`text-lg font-bold text-gray-900 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('tipProfiler.title')}
            </h2>
            <p className={`text-xs text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('tipProfiler.subtitle')}
            </p>
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('tipProfiler.inputPlaceholder')}
          rows={4}
          disabled={loading}
          className={`mt-4 w-full p-4 rounded-xl border-2 border-gray-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none transition-all text-sm text-gray-800 resize-none placeholder:text-gray-400 disabled:bg-gray-50 ${lang === 'hi' ? 'font-hi' : ''}`}
        />

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={input.trim().length < 5 || loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all ${
              input.trim().length >= 5 && !loading
                ? 'bg-accent-500 hover:bg-accent-600 shadow-md shadow-accent-200 active:scale-[0.98]'
                : 'bg-gray-300 cursor-not-allowed'
            } ${lang === 'hi' ? 'font-hi' : ''}`}
          >
            <TrendingUp className="w-5 h-5" />
            {loading ? t('tipProfiler.analyzing') : t('tipProfiler.analyzeBtn')}
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className={`px-5 py-3.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 ${lang === 'hi' ? 'font-hi' : ''}`}
          >
            {t('verify.clearBtn')}
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-3 border-accent-200" />
            <div className="absolute inset-0 w-14 h-14 rounded-full border-3 border-accent-500 border-t-transparent animate-spin" />
            <TrendingUp className="absolute inset-0 m-auto w-6 h-6 text-accent-500" />
          </div>
          <p className={`text-sm text-gray-600 font-medium ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('tipProfiler.analyzing')}
          </p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 animate-fade-in">
          <RiskScoreBadge level={result.riskLevel} score={result.riskScore} confidence={Math.min(70 + result.patternsMatched * 8, 95)} />

          {/* Pattern match summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-bold text-gray-800 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('tipProfiler.patternMatch')}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-error-600">{result.patternsMatched}</span>
                <span className="text-sm text-gray-400">/ {result.totalPatterns}</span>
              </div>
            </div>
            <p className={`text-xs text-gray-500 mb-4 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {result.patternsMatched} {t('tipProfiler.patternsMatched')}
            </p>

            {/* Pattern breakdown */}
            <div className="space-y-2">
              <h4 className={`text-xs font-semibold text-gray-600 uppercase tracking-wide ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('tipProfiler.patternBreakdown')}
              </h4>
              {result.patterns.map((pattern, idx) => (
                <div
                  key={pattern.key}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg ${
                    pattern.matched ? 'bg-error-50 border border-error-100' : 'bg-gray-50'
                  } animate-slide-up`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {pattern.matched ? (
                    <AlertTriangle className="w-4 h-4 text-error-500 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-success-500 shrink-0" />
                  )}
                  <span className={`text-sm ${pattern.matched ? 'text-error-700 font-medium' : 'text-gray-500'} ${lang === 'hi' ? 'font-hi' : ''}`}>
                    {pattern.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className={`p-4 rounded-xl border-2 ${RECOMMENDATION_STYLES[result.riskLevel]} animate-slide-up`}>
            <div className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className={`text-sm font-bold mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                  {t('tipProfiler.recommendation')}
                </h4>
                <p className={`text-sm leading-relaxed ${lang === 'hi' ? 'font-hi' : ''}`}>
                  {t(`tipProfiler.recommendations.${result.riskLevel}`)}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <p className={`text-xs text-gray-500 leading-relaxed ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('tipProfiler.disclaimer')}
            </p>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-8 h-8 text-gray-300" />
          </div>
          <p className={`text-sm text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('tipProfiler.emptyState')}
          </p>
        </div>
      )}
    </div>
  );
}
