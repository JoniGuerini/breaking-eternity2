import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import ptBR from "@/locales/pt-BR.json"
import en from "@/locales/en.json"
import es from "@/locales/es.json"
import it from "@/locales/it.json"
import de from "@/locales/de.json"
import fr from "@/locales/fr.json"
import zhCN from "@/locales/zh-CN.json"
import ja from "@/locales/ja.json"
import ko from "@/locales/ko.json"
import ru from "@/locales/ru.json"
import tr from "@/locales/tr.json"
import pl from "@/locales/pl.json"
import nl from "@/locales/nl.json"
import zhTW from "@/locales/zh-TW.json"
import vi from "@/locales/vi.json"
import th from "@/locales/th.json"
import id from "@/locales/id.json"
import ar from "@/locales/ar.json"
import hi from "@/locales/hi.json"
import uk from "@/locales/uk.json"
import ptPT from "@/locales/pt-PT.json"
import he from "@/locales/he.json"
import cs from "@/locales/cs.json"
import hu from "@/locales/hu.json"
import sv from "@/locales/sv.json"
import da from "@/locales/da.json"
import nb from "@/locales/nb.json"
import fi from "@/locales/fi.json"

const STORAGE_KEY = "breaking_eternity_lang"

export const SUPPORTED_LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "pl", label: "Polski" },
  { code: "nl", label: "Nederlands" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "uk", label: "Українська" },
  { code: "pt-PT", label: "Português (Portugal)" },
  { code: "he", label: "עברית" },
  { code: "cs", label: "Čeština" },
  { code: "hu", label: "Magyar" },
  { code: "sv", label: "Svenska" },
  { code: "da", label: "Dansk" },
  { code: "nb", label: "Norsk" },
  { code: "fi", label: "Suomi" },
] as const

export type SupportedLocale = (typeof SUPPORTED_LANGUAGES)[number]["code"]

const CODES: SupportedLocale[] = ["pt-BR", "en", "es", "it", "de", "fr", "zh-CN", "zh-TW", "ja", "ko", "ru", "tr", "pl", "nl", "vi", "th", "id", "ar", "hi", "uk", "pt-PT", "he", "cs", "hu", "sv", "da", "nb", "fi"]

function getStoredLanguage(): SupportedLocale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && CODES.includes(stored as SupportedLocale)) return stored as SupportedLocale
    return null
  } catch {
    return null
  }
}

export function getLanguage(): SupportedLocale {
  return getStoredLanguage() ?? "pt-BR"
}

export function setLanguage(lang: SupportedLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
    i18n.changeLanguage(lang)
  } catch {
    // ignore
  }
}

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    en: { translation: en },
    es: { translation: es },
    it: { translation: it },
    de: { translation: de },
    fr: { translation: fr },
    "zh-CN": { translation: zhCN },
    ja: { translation: ja },
    ko: { translation: ko },
    ru: { translation: ru },
    tr: { translation: tr },
    pl: { translation: pl },
    nl: { translation: nl },
    "zh-TW": { translation: zhTW },
    vi: { translation: vi },
    th: { translation: th },
    id: { translation: id },
    ar: { translation: ar },
    hi: { translation: hi },
    uk: { translation: uk },
    "pt-PT": { translation: ptPT },
    he: { translation: he },
    cs: { translation: cs },
    hu: { translation: hu },
    sv: { translation: sv },
    da: { translation: da },
    nb: { translation: nb },
    fi: { translation: fi },
  },
  lng: getStoredLanguage() ?? "pt-BR",
  fallbackLng: "pt-BR",
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
