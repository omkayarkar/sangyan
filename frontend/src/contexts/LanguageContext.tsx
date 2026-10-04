import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import type { Language } from '@/lib/types';

import en from '@/i18n/en.json';
import hi from '@/i18n/hi.json';

const translations: Record<Language, Record<string, unknown>> = {
  en,
  hi,
};

const STORAGE_KEY = 'suraksha-lang';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (path: string) => string;
  tObject: (path: string) => Record<string, unknown> | null;
  isHindi: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (
      current &&
      typeof current === 'object' &&
      key in current
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }

  return current;
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        STORAGE_KEY
      ) as Language | null;

      if (saved === 'en' || saved === 'hi') {
        setLangState(saved);
      }
    } catch {
      // localStorage may not be available
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle(
      'font-hi',
      lang === 'hi'
    );
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);

    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'hi' : 'en');
  }, [lang, setLang]);

  const t = useCallback(
    (path: string): string => {
      const value = getNestedValue(
        translations[lang],
        path
      );

      return typeof value === 'string' ? value : path;
    },
    [lang]
  );

  const tObject = useCallback(
    (path: string): Record<string, unknown> | null => {
      const value = getNestedValue(
        translations[lang],
        path
      );

      return value &&
        typeof value === 'object' &&
        !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t,
        tObject,
        isHindi: lang === 'hi',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);

  if (!ctx) {
    throw new Error(
      'useLanguage must be used within LanguageProvider'
    );
  }

  return ctx;
}