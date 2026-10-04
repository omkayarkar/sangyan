import { Shield, Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';

export function Header() {
  const { t, lang, setLang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);

    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const languages = [
    {
      code: 'en' as const,
      label: 'English',
      shortLabel: 'EN',
    },
    {
      code: 'hi' as const,
      label: 'हिंदी',
      shortLabel: 'हिं',
    },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-primary-900/95 backdrop-blur-md shadow-lg'
          : 'bg-primary-900'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shrink-0">
            <Shield
              className="w-5 h-5 text-white"
              strokeWidth={2.5}
            />
          </div>

          <div className="min-w-0">
            <h1
              className={`text-white font-bold text-base leading-tight truncate ${
                lang === 'hi' ? 'font-hi' : ''
              }`}
            >
              {t('app.name')}
            </h1>

            <p
              className={`text-primary-200 text-[11px] leading-tight truncate ${
                lang === 'hi' ? 'font-hi' : ''
              }`}
            >
              {t('app.tagline')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-primary-200 text-xs">
            <span
              className={`px-2 py-0.5 rounded-full bg-primary-800 ${
                lang === 'hi' ? 'font-hi' : ''
              }`}
            >
              {t('common.privacyFirst')}
            </span>
          </div>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-800 hover:bg-primary-700 transition-colors text-white"
              aria-label={t('language.label')}
              aria-expanded={menuOpen}
            >
              <Languages className="w-4 h-4" />

              <span className="text-sm font-semibold uppercase">
                {lang}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden animate-slide-in-right">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => {
                      setLang(language.code);
                      setMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-primary-50 transition-colors ${
                      language.code === 'hi' ? 'font-hi' : ''
                    } ${
                      lang === language.code
                        ? 'text-primary-700 font-semibold bg-primary-50'
                        : 'text-gray-700'
                    }`}
                  >
                    <span>{language.label}</span>

                    {lang === language.code && (
                      <span className="text-primary-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}