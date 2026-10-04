import type { RiskLevel } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldCheck, ShieldAlert, ShieldX, ShieldOff } from 'lucide-react';

interface RiskScoreBadgeProps {
  level: RiskLevel;
  score: number;
  confidence: number;
}

const LEVEL_CONFIG: Record<
  RiskLevel,
  {
    bg: string;
    border: string;
    text: string;
    ring: string;
    icon: typeof ShieldCheck;
    glow: string;
  }
> = {
  low: {
    bg: 'bg-success-50',
    border: 'border-success-200',
    text: 'text-success-700',
    ring: 'ring-success-300',
    icon: ShieldCheck,
    glow: 'shadow-success-200/50',
  },
  medium: {
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    text: 'text-warning-700',
    ring: 'ring-warning-300',
    icon: ShieldAlert,
    glow: 'shadow-warning-200/50',
  },
  high: {
    bg: 'bg-error-50',
    border: 'border-error-200',
    text: 'text-error-700',
    ring: 'ring-error-300',
    icon: ShieldX,
    glow: 'shadow-error-200/50',
  },
  critical: {
    bg: 'bg-error-100',
    border: 'border-error-300',
    text: 'text-error-800',
    ring: 'ring-error-400',
    icon: ShieldOff,
    glow: 'shadow-error-300/60',
  },
};

export function RiskScoreBadge({ level, score, confidence }: RiskScoreBadgeProps) {
  const { t, lang } = useLanguage();
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;

  const levelLabel = t(`verify.riskLevel.${level}`);

  return (
    <div
      className={`rounded-2xl border-2 ${config.border} ${config.bg} p-5 shadow-lg ${config.glow} animate-slide-up`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        <div
          className={`relative w-16 h-16 rounded-full ${config.bg} ${config.ring} ring-2 flex items-center justify-center shrink-0`}
        >
          {level === 'critical' && (
            <span className="absolute inset-0 rounded-full bg-error-400/30 animate-pulse-ring" />
          )}
          <Icon className={`w-8 h-8 ${config.text}`} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs uppercase tracking-wide font-semibold text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('verify.resultTitle')}
          </p>
          <h3 className={`text-2xl font-bold ${config.text} ${lang === 'hi' ? 'font-hi' : ''}`}>
            {levelLabel}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-3xl font-bold ${config.text}`}>{score}</div>
          <div className={`text-[10px] text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>/100</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-medium text-gray-600 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('verify.confidence')}: {confidence}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              level === 'low' ? 'bg-success-500' : level === 'medium' ? 'bg-warning-500' : 'bg-error-500'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            level === 'low' ? 'bg-success-500' : level === 'medium' ? 'bg-warning-500' : 'bg-error-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="mt-3 text-center">
        <p className={`text-xs text-gray-500 font-medium ${lang === 'hi' ? 'font-hi' : ''}`}>
          AI-assisted risk assessment score
        </p>
        <p className={`text-[10px] text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}>
          (Not a probability that the message is a scam)
        </p>
      </div>
    </div>
  );
}
