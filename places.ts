import { requestUrl } from "obsidian";

/** A place suggestion returned by Autocomplete (New). */
export interface PlacePrediction {
	placeId: string;
	primaryText: string;
	secondaryText: string;
}

/** Resolved coordinates + address from Place Details (New). */
export interface PlaceLocation {
	lat: number;
	lng: number;
	address: string;
}

const PLACES_BASE = "https://places.googleapis.com/v1";

/**
 * Fetch live place predictions for the given input using the Places API (New)
 * Autocomplete endpoint. `sessionToken` should be reused across calls and the
 * subsequent {@link placeDetails} call so Google bills them as one session.
 */
export async function autocomplete(
	input: string,
	sessionToken: string,
	apiKey: string,
): Promise<PlacePrediction[]> {
	const resp = await requestUrl({
		url: `${PLACES_BASE}/places:autocomplete`,
		method: "POST",
		contentType: "application/json",
		headers: {
			"X-Goog-Api-Key": apiKey,
			"X-Goog-FieldMask":
				"suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat",
		},
		body: JSON.stringify({ input, sessionToken }),
		throw: false,
	});

	if (resp.status < 200 || resp.status >= 300) {
		throw new Error(errorMessage(resp));
	}

	const suggestions: unknown[] = resp.json?.suggestions ?? [];
	return suggestions
		.map((s) => (s as { placePrediction?: RawPrediction }).placePrediction)
		.filter((p): p is RawPrediction => Boolean(p?.placeId))
		.map((p) => ({
			placeId: p.placeId,
			primaryText:
				p.structuredFormat?.mainText?.text ?? p.text?.text ?? p.placeId,
			secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
		}));
}

/**
 * Resolve a place's coordinates and formatted address by place ID using the
 * Places API (New) Place Details endpoint.
 */
export async function placeDetails(
	placeId: string,
	sessionToken: string,
	apiKey: string,
): Promise<PlaceLocation> {
	const resp = await requestUrl({
		url: `${PLACES_BASE}/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`,
		method: "GET",
		headers: {
			"X-Goog-Api-Key": apiKey,
			"X-Goog-FieldMask": "location,formattedAddress",
		},
		throw: false,
	});

	if (resp.status < 200 || resp.status >= 300) {
		throw new Error(errorMessage(resp));
	}

	const location = resp.json?.location;
	if (
		!location ||
		typeof location.latitude !== "number" ||
		typeof location.longitude !== "number"
	) {
		throw new Error("Place details response did not include coordinates.");
	}

	return {
		lat: location.latitude,
		lng: location.longitude,
		address: resp.json?.formattedAddress ?? "",
	};
}

interface RawPrediction {
	placeId: string;
	text?: { text?: string };
	structuredFormat?: {
		mainText?: { text?: string };
		secondaryText?: { text?: string };
	};
}

function errorMessage(resp: { status: number; json?: { error?: { message?: string } } }): string {
	const apiMessage = resp.json?.error?.message;
	return apiMessage
		? `Google Places API error (${resp.status}): ${apiMessage}`
		: `Google Places API request failed with status ${resp.status}.`;
}
