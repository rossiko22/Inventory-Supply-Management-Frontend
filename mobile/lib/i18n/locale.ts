// Locale scaffolding.
//
// Today the app ships one locale (Slovenian). The structure here exists so
// adding a second locale (EN, HR, …) is a one-file change:
//   1. Add `en: enStrings` to `MESSAGES` below.
//   2. Add 'en' to the `Locale` union.
// Nothing else has to move. Components that import `sl` directly keep working;
// new code should prefer `useStrings()` so it automatically follows the
// active locale.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sl } from '@/constants/i18n';

export type Locale = 'sl';
export type Strings = typeof sl;

const MESSAGES: Record<Locale, Strings> = {
  sl,
};

export const DEFAULT_LOCALE: Locale = 'sl';

// Returns the strings table for an explicit locale. Falls back to default
// if the locale isn't shipped.
export function getStrings(locale: Locale = DEFAULT_LOCALE): Strings {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
}

// Lightweight locale store. To wire device-locale detection later:
//   import * as Localization from 'expo-localization';
//   const device = Localization.getLocales()[0]?.languageCode as Locale | undefined;
//   useLocaleStore.getState().setLocale(device ?? DEFAULT_LOCALE);
interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name:    'locale-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// React hook — returns the strings table for the active locale.
// Components: `const t = useStrings(); t.common.save`
export function useStrings(): Strings {
  const locale = useLocaleStore((s) => s.locale);
  return getStrings(locale);
}

// Standalone helper — for non-React code (axios formatters, queue workers, …).
export function getActiveStrings(): Strings {
  return getStrings(useLocaleStore.getState().locale);
}
