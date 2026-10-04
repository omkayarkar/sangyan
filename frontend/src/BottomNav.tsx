import { Home, ShieldCheck, BookOpen, NotebookPen, LifeBuoy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type TabId = 'home' | 'verify' | 'learn' | 'journal' | 'help';

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const { t, lang } = useLanguage();

  const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'verify', label: t('nav.verify'), icon: ShieldCheck },
    { id: 'learn', label: t('nav.learn'), icon: BookOpen },
    { id: 'journal', label: t('nav.journal'), icon: NotebookPen },
    { id: 'help', label: t('nav.help'), icon: LifeBuoy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-5xl mx-auto flex items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
  return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary-500 rounded-full" />
              )}
              <Icon
                className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium leading-none ${lang === 'hi' ? 'font-hi' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
