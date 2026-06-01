import { Notice, Plugin, type TFile } from "obsidian";
import {
	type CorduroySettings,
	DEFAULT_SETTINGS,
	CorduroySettingTab,
} from "./settings";
import { PlaceSearchModal } from "./search-modal";
import { placeDetails } from "./places";

export default class CorduroyPlugin extends Plugin {
	override settings: CorduroySettings = DEFAULT_SETTINGS;

	override async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "search-place-insert-coordinates",
			name: "Search for a place and insert coordinates",
			callback: () => this.searchAndInsert(),
		});

		this.addSettingTab(new CorduroySettingTab(this.app, this));
	}

	private searchAndInsert(): void {
		const { apiKeySecretName } = this.settings;
		const apiKey = apiKeySecretName
			? this.app.secretStorage.getSecret(apiKeySecretName)
			: null;
		if (!apiKey) {
			new Notice("Set your Google Maps API key in Corduroy settings.");
			return;
		}

		const file = this.app.workspace.getActiveFile();
		if (!file || file.extension !== "md") {
			new Notice("Open a Markdown note before searching for a place.");
			return;
		}

		new PlaceSearchModal(this.app, apiKey, (placeId, sessionToken) => {
			void this.insertCoordinates(file, placeId, sessionToken, apiKey);
		}).open();
	}

	private async insertCoordinates(
		file: TFile,
		placeId: string,
		sessionToken: string,
		apiKey: string,
	): Promise<void> {
		try {
			const place = await placeDetails(placeId, sessionToken, apiKey);
			await this.app.fileManager.processFrontMatter(file, (fm) => {
				fm[this.settings.coordinatesProperty] = [
					String(place.lat),
					String(place.lng),
				];
				if (this.settings.writeAddress && place.address) {
					fm[this.settings.addressProperty] = place.address;
				}
			});
			new Notice(
				place.address
					? `Inserted coordinates for ${place.address}.`
					: "Inserted coordinates.",
			);
		} catch (err) {
			new Notice(err instanceof Error ? err.message : String(err));
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
