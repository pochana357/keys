import { createSettings } from '$lib/localStorageWrapper.svelte';
import { setContext, getContext } from 'svelte';
import type Log from './api/Log.svelte';
import { browser } from '$app/environment';

export const OReferenceTime = { dungeon: 'dungeon', pull: 'pull' } as const;
export type ReferenceTime = (typeof OReferenceTime)[keyof typeof OReferenceTime];

export type Settings = {
	pxPerSec: number;
	horizontalOverlap: number;
	pxPerLevel: number;
	showMinor: boolean;
	showReceived: boolean;
	pullStartAsReferenceTime: boolean;
	damageGroupInterval: number;
};
const defaultSettings: Settings = {
	pxPerSec: 10.0,
	horizontalOverlap: 15.0, // in pixel
	pxPerLevel: 20.0,
	showMinor: false,
	showReceived: true,
	pullStartAsReferenceTime: true,
	damageGroupInterval: 3000
};
export const settingsRange = {
	pxPerSec: [5.0, 20.0],
	horizontalOverlap: [1.0, 25.0],
	pxPerLevel: [15.0, 25.0],
	damageGroupInterval: [0, 10000]
};
type HistoryItem = {
	code: string;
	timestamp: number;
	exportedCharacters: string[];
};

const defaultCurrentPage = {
	code: '',
	fightIdx: -1,
	dungeonPullIdx: -1
};
export type currentPage = typeof defaultCurrentPage;

const defaultHistory: { items: HistoryItem[] } = { items: [] };

export const OApiStatus = { busy: 'busy', failed: 'failed', succeeded: 'succeeded' } as const;
type ApiStatus = (typeof OApiStatus)[keyof typeof OApiStatus];
const maxHistory = 10;
const defaultApiStatus: { status: ApiStatus } = { status: OApiStatus.succeeded };

const defaultVisibility = {
	history: false,
	settings: false,
	outline: true
};
export type Visibility = typeof defaultVisibility;

function updateUrl(urlParams: URLSearchParams) {
	if (browser) window.history.pushState({}, '', `?${urlParams.toString()}`);
}
export class AppState {
	settings = createSettings(defaultSettings);
	history = createSettings(defaultHistory);
	api = createSettings(defaultApiStatus);
	#currentPage = createSettings(defaultCurrentPage);
	visibility = createSettings(defaultVisibility);
	urlParams: URLSearchParams = new URLSearchParams();

	static defaultSettings = defaultSettings;
	static defaultCurrentPage = defaultCurrentPage;
	static defaultHistory = defaultHistory;

	constructor() {
		setContext('appSettings', this);
	}

	get code() {
		return this.#currentPage.code;
	}
	get fightIdx() {
		return this.#currentPage.fightIdx;
	}
	get dungeonPullIdx() {
		return this.#currentPage.dungeonPullIdx;
	}
	set code(code: string) {
		this.#currentPage.code = code;
		this.urlParams.set('code', code);
		updateUrl(this.urlParams);
	}
	set fightIdx(fightIdx: number) {
		this.#currentPage.fightIdx = fightIdx;
		this.urlParams.set('fight', fightIdx.toString());
		updateUrl(this.urlParams);
	}
	set dungeonPullIdx(dungeonPullIdx: number) {
		this.#currentPage.dungeonPullIdx = dungeonPullIdx;
		this.urlParams.set('pull', dungeonPullIdx.toString());
		updateUrl(this.urlParams);
	}

	resetSettings() {
		this.settings = createSettings(defaultSettings);
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
		if (typeof settings.showMinor !== 'boolean') settings.showMinor = defaultSettings.showMinor;
	}

	pushCodeToHistory(log: Log) {
		if (!log?.code) return;
		const newCode = {
			code: log.code,
			timestamp: log.fights.json?.start || 0,
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
