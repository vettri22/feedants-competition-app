import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  dictionaries,
  interpolate,
  loadPersistedLanguage,
  persistLanguage,
  type Language,
  type TranslationKey,
} from "@/lib/i18n";
import { api } from "@/convex/_generated/api";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { useAuth } from "@/hooks/use-auth";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => loadPersistedLanguage());
  const { isAuthenticated } = useAuth();
  const user = useConvexQuery(api.users.currentUser, {});
  const updateMe = useConvexMutation(api.users.updateMe);

  // Sync language from backend profile when signed in (backend wins on login).
  useEffect(() => {
    if (isAuthenticated && user?.preferredLanguage && user.preferredLanguage !== language) {
      setLanguageState(user.preferredLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.preferredLanguage]);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      persistLanguage(lang);
      if (isAuthenticated) {
        void updateMe({ preferredLanguage: lang });
      }
    },
    [isAuthenticated, updateMe],
  );

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      interpolate(dictionaries[language][key] ?? dictionaries.ENG[key] ?? key, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
