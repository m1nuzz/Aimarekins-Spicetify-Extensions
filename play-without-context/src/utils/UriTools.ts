/**
 * `Spicetify.URI` is not exposed by recent versions of Spicetify (Spotify 1.3+),
 * so URIs are parsed manually here instead of relying on `Spicetify.URI.from`.
 */

const SPOTIFY_URI_PREFIX = "spotify:"

/** Extracts the URI string out of the values Spicetify hands over to extensions. */
export function coerceSpicetifyUri(source: unknown): string {
	if (typeof source === "string") {
		if (!source.startsWith(SPOTIFY_URI_PREFIX)) {
			throw new Error(`Not a Spotify URI: ${source}`)
		}

		return source
	}

	const candidate = source as { uri?: unknown } | null | undefined

	if (candidate && typeof candidate === "object" && typeof candidate.uri === "string") {
		return coerceSpicetifyUri(candidate.uri)
	}

	throw new Error(`Invalid URI: ${String(source)}`)
}

/**
 * The URI type is the part right after the `spotify:` prefix.
 * `spotify:track:4cOdK2wGLETKBW3PvgPWqT` -> `track`
 */
export function getSpicetifyUriType(source: unknown): string {
	const uri = coerceSpicetifyUri(source)
	const type = uri.split(":")[1]

	if (!type) {
		throw new Error(`Invalid URI: ${uri}`)
	}

	return type
}

export function coerceSpicetifyUriType(source: unknown, expectedType: string | string[]): string {
	const uri = coerceSpicetifyUri(source)
	const expectedTypes = Array.isArray(expectedType) ? expectedType : [expectedType]
	const type = getSpicetifyUriType(uri)

	if (!expectedTypes.includes(type)) {
		throw new Error(`Expected URI type to be one of ${expectedTypes.join(", ")} but got ${type}`)
	}

	return uri
}
