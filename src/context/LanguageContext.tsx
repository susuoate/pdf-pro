import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Language } from '../locales/types';
import { translate } from '../locales';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const LANG_STORAGE_KEY = 'pdfpro_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
    if (saved === 'en' || saved === 'th') {
      return saved;
    }
    const browserLang = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'th';
    return browserLang.startsWith('th') ? 'th' : 'en';
  });

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'th' : 'en'));
  };

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      return translate(language, path, params);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
