import { createSettings } from '$lib/localStorageWrapper.svelte';
import { setContext, getContext } from 'svelte';
import type Log from './api/log';

export const defaultSettings = {
	pxPerSec: 10.0,
	horizontalOverlap: 15.0, // in pixel
	pxPerLevel: 20.0,
	showMinors: false
};
export const settingsRange = {
	pxPerSec: [5.0, 20.0],
	horizontalOverlap: [1.0, 25.0],
	pxPerLevel: [15.0, 25.0]
};
export type Settings = typeof defaultSettings;
type HistoryItem = {
	code: string;
	timestamp: number;
	exportedCharacters: string[];
};
const defaultHistory: { items: HistoryItem[] } = { items: [] };

export const OApiStatus = { busy: 'busy', failed: 'failed', succeeded: 'succeeded' } as const;
type ApiStatus = (typeof OApiStatus)[keyof typeof OApiStatus];
const maxHistory = 10;
const defaultApiStatus: { status: ApiStatus } = { status: OApiStatus.succeeded };

export class AppState {
	settings = createSettings(defaultSettings);
	history = createSettings(defaultHistory);
	api = createSettings(defaultApiStatus);

	constructor() {
		setContext('appSettings', this);
	}

	validateSettings() {
		const settings = this.settings;
		if (
			typeof settings.pxPerLevel !== 'number' ||
			settings.pxPerSec < settingsRange.pxPerSec[0] ||
			settings.pxPerSec > settingsRange.pxPerSec[1]
		)
			settings.pxPerSec = defaultSettings.pxPerSec;
		if (
			typeof settings.pxPerLevel !== 'number' ||
			settings.horizontalOverlap < settingsRange.horizontalOverlap[0] ||
			settings.horizontalOverlap > settingsRange.horizontalOverlap[1]
		)
			settings.horizontalOverlap = defaultSettings.horizontalOverlap;
		if (
			typeof settings.pxPerLevel !== 'number' ||
			settings.pxPerLevel < settingsRange.pxPerLevel[0] ||
			settings.pxPerLevel > settingsRange.pxPerLevel[1]
		)
			settings.pxPerLevel = defaultSettings.pxPerLevel;
		if (typeof settings.showMinors !== 'boolean') settings.showMinors = defaultSettings.showMinors;
	}

	pushCode(log: Log) {
		const newCode = {
			code: log.code,
			timestamp: log.fights.json.start,
			exportedCharacters: log.exportedCharacters
		};
		const newItems = this.history.items.filter((item) => item.code !== log.code);
		newItems.push(newCode);
		this.history.items = newItems.length <= maxHistory ? newItems : newItems.slice(1);
	}
	clearHistory() {
		this.history.items = [this.history.items[this.history.items.length - 1]];
	}
	isBusy() {
		return this.api.status === OApiStatus.busy;
	}
}
export function getAppState() {
	return getContext('appSettings') as AppState;
}
