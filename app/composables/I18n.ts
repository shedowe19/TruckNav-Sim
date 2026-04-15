import { de } from "~/data/locales/de";
import { en } from "~/data/locales/en";

export type SupportedLocale = "de" | "en";

const locales: Record<SupportedLocale, typeof de> = { de, en };

const LOCALE_STORAGE_KEY = "truck-nav-locale";

export const useI18n = () => {
    const locale = useState<SupportedLocale>("i18n-locale", () => {
        if (import.meta.client) {
            const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
            if (saved === "de" || saved === "en") return saved;
        }
        return "de";
    });

    const t = computed(() => locales[locale.value]);

    const setLocale = (lang: SupportedLocale) => {
        locale.value = lang;
        if (import.meta.client) {
            localStorage.setItem(LOCALE_STORAGE_KEY, lang);
        }
    };

    return { locale, t, setLocale };
};
