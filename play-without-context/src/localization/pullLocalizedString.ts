import loc from "./loc.json"

const FALLBACK_LANG = "en"
const TRANSLATIONS: Record<string, string> = loc

/**
 * `Spicetify.Locale` is not always available, so an unknown locale must not throw:
 * a thrown error here used to abort the whole registration of the menu item.
 */
export default function pullLocalizedString(localization?: string): string {
	const language = typeof localization === "string" && localization.length > 0 ? localization : FALLBACK_LANG

	return TRANSLATIONS[language] || TRANSLATIONS[language.split("-")[0]] || TRANSLATIONS[FALLBACK_LANG]
}
