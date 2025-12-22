import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && (saved === 'tr' || saved === 'en')) return saved;

    // Check browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('tr')) return 'tr';

    return 'en'; // Default to English
  });

  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load translation file
    import(`../locales/${language}.ts`).then((module) => {
      setTranslations(module.default);
    });

    // Save to localStorage
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[key] || key;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
