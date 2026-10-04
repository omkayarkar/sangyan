import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { RedFlag } from '@/lib/types';

interface FlagListProps {
  flags: RedFlag[];
}

const SEVERITY_CONFIG = {
  medium: { icon: AlertTriangle, color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-200' },
  high: { icon: XCircle, color: 'text-error-600', bg: 'bg-error-50', border: 'border-error-200' },
  critical: { icon: XCircle, color: 'text-error-700', bg: 'bg-error-100', border: 'border-error-300' },
} as const;

export function FlagList({ flags }: FlagListProps) {
  const { t, lang } = useLanguage();

  if (flags.length === 0) {
    return (
      <div className={`flex items-start gap-3 p-4 rounded-xl bg-success-50 border border-success-200 animate-fade-in`}>
        <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0 mt-0.5" />
        <p className={`text-sm text-success-800 ${lang === 'hi' ? 'font-hi' : ''}`}>{t('verify.noRiskFound')}</p>
      </div>
    );
  }

  const sorted = [...flags].sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-2.5">
      {sorted.map((flag, idx) => {
        const config = SEVERITY_CONFIG[flag.severity];
        const Icon = config.icon;
        const translated = t(`verify.redFlags.${flag.key}`);
        const flagText = translated === `verify.redFlags.${flag.key}` ? flag.key : translated;
        return (
          <div
            key={`${flag.key}-${idx}`}
            className={`flex items-start gap-3 p-3.5 rounded-xl ${config.bg} border ${config.border} animate-slide-up`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <Icon className={`w-5 h-5 ${config.color} shrink-0 mt-0.5`} />
            <p className={`text-sm text-gray-800 leading-relaxed ${lang === 'hi' ? 'font-hi' : ''}`}>
              {flagText}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function EvidenceList({ evidence }: { evidence: string[] }) {
  const { t, lang } = useLanguage();

  if (evidence.length === 0) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-gray-500" />
        <h4 className={`text-sm font-semibold text-gray-700 ${lang === 'hi' ? 'font-hi' : ''}`}>
          {t('verify.evidence')}
        </h4>
      </div>
      <ul className="space-y-1.5">
        {evidence.map((item, idx) => (
          <li key={idx} className={`text-xs text-gray-600 flex items-start gap-2 ${lang === 'hi' ? 'font-hi' : ''}`}>
            <span className="text-gray-400 mt-0.5">•</span>
            <span className="break-all">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
