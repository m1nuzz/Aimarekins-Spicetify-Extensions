import waitPolledCondition from "wait-polled-condition"
import { playWithoutContext, PLAYABLE_WITHOUT_CONTEXT_URI_TYPES, prependToQueue } from "./utils/PlayerTools"
import { tryCatch } from "./utils/TryCatch"
import { coerceSpicetifyUriType } from "./utils/UriTools"
import pullLocalizedString from "./localization/pullLocalizedString"

const EXPECTED_TYPE_ERROR = "Expected URI type"

/**
 * Globals the wrapper only creates once its asynchronous webpack initialisation has finished.
 *
 * `Spicetify.ContextMenu` is defined synchronously, but `ContextMenu.Item` extends
 * `ContextMenuV2.Item`, whose constructor renders itself with `Spicetify.ReactJSX.jsx()`.
 * ReactJSX is assigned only after the webpack chunks load, so building the item too early
 * throws — and because that happens inside a `.then()`, the menu item vanishes without
 * a single error being logged.
 */
interface LateSpicetifyGlobals {
	ReactJSX?: unknown
	Events?: {
		webpackLoaded?: {
			/** Runs the callback now when the event has already fired, otherwise on the next fire. */
			on: (callback: () => void) => void
		}
	}
}

function hasReactJSX(): boolean {
	return Boolean((Spicetify as unknown as LateSpicetifyGlobals).ReactJSX)
}

/**
 * A failing type check must not hide the menu item, so a mismatch is treated as "not playable",
 * while anything unexpected is reported to the console instead of disappearing silently.
 */
function isPlayableWithoutContext(uri: unknown): boolean {
	const [succeeded, error] = tryCatch(coerceSpicetifyUriType, uri, PLAYABLE_WITHOUT_CONTEXT_URI_TYPES)

	if (!succeeded && !(error instanceof Error && error.message.startsWith(EXPECTED_TYPE_ERROR))) {
		console.warn("[play-without-context] Could not read the type of", uri, error)
	}

	return succeeded
}

/** `Spicetify.Locale` is not exposed on every page, so the browser language is used as a fallback. */
function getLocale(): string {
	return Spicetify.Locale?.getLocale?.() ?? navigator.language
}

let hasRegistered = false

function registerMenuItem(): void {
	if (hasRegistered || !Spicetify.ContextMenu?.Item || !hasReactJSX()) return

	hasRegistered = true

	const menuItem = new Spicetify.ContextMenu.Item(
		pullLocalizedString(getLocale()),
		(uris: string[]) => {
			if (uris.length > 1) {
				playWithoutContext(uris[0])
				prependToQueue(uris.slice(1))
			} else {
				playWithoutContext(uris[0])
			}
		},
		(uris: string[]) => uris.length > 0 && uris.every(isPlayableWithoutContext),
		"play"
	)

	menuItem.register()
}

// `webpackLoaded` fires right after ReactJSX has been assigned, so this is the earliest
// safe moment to build the item — and it is the intended hook for exactly this purpose.
const webpackLoaded = (Spicetify as unknown as LateSpicetifyGlobals).Events?.webpackLoaded
webpackLoaded?.on(registerMenuItem)

// Fallback in case the event never fires: poll for every global the item needs.
waitPolledCondition([
	() => window.Spicetify,
	() => Spicetify.ContextMenu,
	() => Spicetify.Player,
	hasReactJSX
]).then(registerMenuItem)
