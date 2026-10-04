import { ShieldCheck, TrendingUp, BookOpen, NotebookPen, LifeBuoy, AlertCircle, ChevronRight, Wifi, Lock, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TabId } from './BottomNav';

interface HomePageProps {
  onNavigate: (tab: TabId) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { t, lang } = useLanguage();

  const features: { id: TabId; title: string; desc: string; icon: typeof ShieldCheck; color: string; bgColor: string }[] = [
    { id: 'verify', title: t('home.quickVerify'), desc: t('home.quickVerifyDesc'), icon: ShieldCheck, color: 'text-primary-600', bgColor: 'bg-primary-50' },
    { id: 'verify', title: t('home.tipProfiler'), desc: t('home.tipProfilerDesc'), icon: TrendingUp, color: 'text-accent-600', bgColor: 'bg-accent-50' },
    { id: 'learn', title: t('home.learnTitle'), desc: t('home.learnDesc'), icon: BookOpen, color: 'text-success-600', bgColor: 'bg-success-50' },
    { id: 'journal', title: t('home.journalTitle'), desc: t('home.journalDesc'), icon: NotebookPen, color: 'text-primary-600', bgColor: 'bg-primary-50' },
    { id: 'help', title: t('home.grievanceTitle'), desc: t('home.grievanceDesc'), icon: LifeBuoy, color: 'text-error-600', bgColor: 'bg-error-50' },
  ];

  const stats = [
    { value: '12,400+', label: t('home.statsScamsAvoided') },
    { value: '8,900+', label: t('home.statsUsersProtected') },
    { value: '<60s', label: t('home.statsAvgTime') },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 rounded-3xl p-6 text-white relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-6 h-6 text-primary-300" strokeWidth={2.5} />
            <span className={`text-sm font-medium text-primary-200 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('app.name')}
            </span>
          </div>
          <h1 className={`text-2xl font-bold leading-tight mb-1.5 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('home.welcome')}
          </h1>
          <p className={`text-sm text-primary-100 leading-relaxed mb-4 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('home.welcomeSub')}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className={`text-[10px] text-primary-200 leading-tight ${lang === 'hi' ? 'font-hi' : ''}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-error-50 border border-error-200 animate-fade-in">
        <AlertCircle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className={`text-sm text-error-800 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('home.emergencyBanner')}
          </p>
          <button
            onClick={() => onNavigate('help')}
            className={`mt-1.5 text-sm font-semibold text-error-700 hover:text-error-800 flex items-center gap-1 ${lang === 'hi' ? 'font-hi' : ''}`}
          >
            {t('nav.help')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="space-y-3">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          const isProfiler = feature.title === t('home.tipProfiler');
          return (
            <button
              key={idx}
              onClick={() => onNavigate(isProfiler ? 'verify' : feature.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all text-left animate-slide-up active:scale-[0.99]`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${feature.color}`} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-bold text-gray-900 ${lang === 'hi' ? 'font-hi' : ''}`}>
                  {feature.title}
                </h3>
                <p className={`text-xs text-gray-500 leading-snug ${lang === 'hi' ? 'font-hi' : ''}`}>
                  {feature.desc}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Lock className="w-3.5 h-3.5" />
          <span className={lang === 'hi' ? 'font-hi' : ''}>{t('common.privacyFirst')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Wifi className="w-3.5 h-3.5" />
          <span className={lang === 'hi' ? 'font-hi' : ''}>{t('common.onDevice')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Globe className="w-3.5 h-3.5" />
          <span>{t('common.bilingual')}</span>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center pb-2">
        <p className={`text-xs text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}>
          {t('app.footerNote')}
        </p>
      </div>
    </div>
  );
}
