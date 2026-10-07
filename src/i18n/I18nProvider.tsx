import { createContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLanguageStore, makeT, readDeviceLocale, type Lang, type TFunction } from "./index";

/**
 * The app's one language store. Created when this module is first imported (App.tsx imports it), so the stored
 * choice is already being read before anything renders - in parallel with the offline-cache restore, which holds the
 * first screen back anyway. Nothing ever waits for it (docs/I18N_DECISIONS.md, D10).
 */
export const languageStore = createLanguageStore({ storage: AsyncStorage, deviceLocale: readDeviceLocale() });

export interface I18nValue {
  lang: Lang;
  t: TFunction;
  setLanguage: (lang: Lang) => Promise<void>;
}

const valueFor = (lang: Lang): I18nValue => ({ lang, t: makeT(lang), setLanguage: languageStore.setLanguage });

// The default (no provider above) still follows the store, so a component rendered outside the provider cannot crash.
export const I18nContext = createContext<I18nValue>(valueFor(languageStore.getLanguage()));

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const lang = useSyncExternalStore(languageStore.subscribe, languageStore.getLanguage, languageStore.getLanguage);
  const value = useMemo(() => valueFor(lang), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
