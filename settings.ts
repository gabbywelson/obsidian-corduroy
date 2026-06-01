import { App, PluginSettingTab, SecretComponent, Setting } from "obsidian";
import type CorduroyPlugin from "./main";

export interface CorduroySettings {
	/** Name of the entry in Obsidian's secret storage holding the API key. */
	apiKeySecretName: string;
	/** Frontmatter property to receive the [lat, lng] string list. */
	coordinatesProperty: string;
	/** Frontmatter property to receive the formatted address. */
	addressProperty: string;
	/** Whether to also write the formatted address. */
	writeAddress: boolean;
}

export const DEFAULT_SETTINGS: CorduroySettings = {
	apiKeySecretName: "",
	coordinatesProperty: "coordinates",
	addressProperty: "address",
	writeAddress: true,
};

const PLACES_DOCS_URL =
	"https://developers.google.com/maps/documentation/places/web-service/place-autocomplete";

export class CorduroySettingTab extends PluginSettingTab {
	plugin: CorduroyPlugin;

	constructor(app: App, plugin: CorduroyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	override display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const apiKeySetting = new Setting(containerEl)
			.setName("Google Maps API key")
			.addComponent((el) =>
				new SecretComponent(this.app, el)
					.setValue(this.plugin.settings.apiKeySecretName)
					.onChange(async (value) => {
						this.plugin.settings.apiKeySecretName = value;
						await this.plugin.saveSettings();
					}),
			);
		apiKeySetting.descEl.createSpan({
			text: "Stored securely in Obsidian's secret storage. Your Google Cloud project must have the ",
		});
		apiKeySetting.descEl.createEl("a", {
			text: "Places API (New)",
			href: PLACES_DOCS_URL,
		});
		apiKeySetting.descEl.createSpan({ text: " enabled." });

		new Setting(containerEl)
			.setName("Coordinates property")
			.setDesc("Frontmatter property to receive the [latitude, longitude] list.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.coordinatesProperty)
					.setValue(this.plugin.settings.coordinatesProperty)
					.onChange(async (value) => {
						this.plugin.settings.coordinatesProperty =
							value.trim() || DEFAULT_SETTINGS.coordinatesProperty;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Write address")
			.setDesc("Also write the place's formatted address to frontmatter.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.writeAddress)
					.onChange(async (value) => {
						this.plugin.settings.writeAddress = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (this.plugin.settings.writeAddress) {
			new Setting(containerEl)
				.setName("Address property")
				.setDesc("Frontmatter property to receive the formatted address.")
				.addText((text) =>
					text
						.setPlaceholder(DEFAULT_SETTINGS.addressProperty)
						.setValue(this.plugin.settings.addressProperty)
						.onChange(async (value) => {
							this.plugin.settings.addressProperty =
								value.trim() || DEFAULT_SETTINGS.addressProperty;
							await this.plugin.saveSettings();
						}),
				);
		}
	}
}
