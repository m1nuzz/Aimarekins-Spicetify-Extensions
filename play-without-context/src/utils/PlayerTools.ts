import { coerceSpicetifyUri, coerceSpicetifyUriType, getSpicetifyUriType } from "./UriTools"

const LOCAL_FILES_URI = "spotify:internal:local-files"
const LOCAL_URI_TYPE = "local"
export const PLAYABLE_WITHOUT_CONTEXT_URI_TYPES = ["track", "episode", LOCAL_URI_TYPE]

export function playWithoutContext(
	uri: unknown
): ReturnType<typeof Spicetify.Player.origin.play | typeof Spicetify.Player.playUri> {
	const coercedUri = coerceSpicetifyUriType(uri, PLAYABLE_WITHOUT_CONTEXT_URI_TYPES)

	if (getSpicetifyUriType(coercedUri) === LOCAL_URI_TYPE) {
		return Spicetify.Player.origin.play(
			{
				uri: LOCAL_FILES_URI,
				pages: [
					{
						items: [
							{
								uri: coercedUri
							}
						]
					}
				]
			},
			{},
			{}
		)
	} else {
		return Spicetify.Player.playUri(coercedUri)
	}
}

const QUEUE_INTERACTION = { interactionId: null }

export function prependToQueue(
	uris: unknown[]
): ReturnType<typeof Spicetify.Player.origin.addToQueue | typeof Spicetify.Player.origin.insertIntoQueue> {
	const urisToInsert = uris.map((uri) => ({ uri: coerceSpicetifyUri(uri), uid: null }))
	const firstQueuedItem = Spicetify.Player.origin.getQueue?.()?.queued?.[0]

	if (firstQueuedItem) {
		return Spicetify.Player.origin.insertIntoQueue(
			urisToInsert,
			{
				before: {
					uri: firstQueuedItem.uri,
					uid: firstQueuedItem.uid
				}
			},
			QUEUE_INTERACTION
		)
	} else {
		return Spicetify.Player.origin.addToQueue(urisToInsert, QUEUE_INTERACTION)
	}
}
