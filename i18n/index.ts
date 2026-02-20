import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import en from './locales/en';
import tr from './locales/tr';

export type Locale = 'en' | 'tr';
type TranslationKeys = keyof typeof en;

const translations: Record<Locale, Record<string, string>> = { en, tr };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('locale') as Locale;
      if (saved === 'en' || saved === 'tr') return saved;
    } catch {}
    const browserLang = navigator.language.slice(0, 2);
    return browserLang === 'tr' ? 'tr' : 'en';
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKeys): string => {
      return translations[locale]?.[key] || translations.en[key] || key;
    },
    [locale]
  );

  return React.createElement(
    I18nContext.Provider,
    { value: { locale, setLocale, t } },
    children
  );
};

export const useTranslation = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
};
