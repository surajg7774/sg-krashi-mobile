import { useContext } from "react";
import { I18nContext, type I18nValue } from "./I18nProvider";

/**
 * The current language and its t():
 *   const { t, lang, setLanguage } = useT();
 *   t("common.retry"); t("cart.itemCount", { count: 3 }); t("auth.otpSentTo", { email });
 * Re-renders the component when the language changes.
 */
export const useT = (): I18nValue => useContext(I18nContext);
