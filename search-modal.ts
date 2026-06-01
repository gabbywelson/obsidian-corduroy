import { App, Notice, SuggestModal, debounce, type Debouncer } from "obsidian";
import { autocomplete, type PlacePrediction } from "./places";

type Resolve = (results: PlacePrediction[]) => void;

/**
 * A search-as-you-type modal that queries Google Places Autocomplete and, on
 * selection, hands the chosen place ID back to the caller. Network calls are
 * debounced and share a single session token for the lifetime of the modal.
 */
export class PlaceSearchModal extends SuggestModal<PlacePrediction> {
	private readonly apiKey: string;
	private readonly sessionToken: string;
	private readonly onChoose: (placeId: string, sessionToken: string) => void;
	private readonly debouncedFetch: Debouncer<[string, Resolve], void>;

	constructor(
		app: App,
		apiKey: string,
		onChoose: (placeId: string, sessionToken: string) => void,
	) {
		super(app);
		this.apiKey = apiKey;
		this.onChoose = onChoose;
		this.sessionToken = crypto.randomUUID();

		this.setPlaceholder("Search for a place…");
		this.emptyStateText = "Type at least 2 characters to search.";

		this.debouncedFetch = debounce(
			(query: string, resolve: Resolve) => {
				autocomplete(query, this.sessionToken, this.apiKey)
					.then(resolve)
					.catch((err) => {
						new Notice(err instanceof Error ? err.message : String(err));
						resolve([]);
					});
			},
			300,
			true,
		);
	}

	override getSuggestions(query: string): Promise<PlacePrediction[]> {
		const trimmed = query.trim();
		if (trimmed.length < 2) return Promise.resolve([]);
		return new Promise((resolve) => this.debouncedFetch(trimmed, resolve));
	}

	override renderSuggestion(prediction: PlacePrediction, el: HTMLElement): void {
		el.createDiv({
			text: prediction.primaryText,
			cls: "corduroy-suggestion-title",
		});
		if (prediction.secondaryText) {
			el.createDiv({
				text: prediction.secondaryText,
				cls: "corduroy-suggestion-note",
			});
		}
	}

	override onChooseSuggestion(prediction: PlacePrediction): void {
		this.onChoose(prediction.placeId, this.sessionToken);
	}
}
