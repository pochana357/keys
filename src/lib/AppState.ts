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
export type Range = {
	min: number;
	max: number;
};
export const settingsRange: { [name: string]: Range } = {
	pxPerSec: { min: 5.0, max: 20.0 },
	horizontalOverlap: { min: 1.0, max: 25.0 },
	pxPerLevel: { min: 15.0, max: 25.0 },
	damageGroupInterval: { min: 0, max: 5000 }
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
	static validateNumber(value: unknown, range: Range, defaultValue: number) {
		if (typeof value !== 'number' || isNaN(value)) return defaultValue;
		if (value < range.min) return range.min;
		if (value > range.max) return range.max;
		return value;
	}
	static validateBoolean(value: unknown, defaultValue: boolean) {
		if (typeof value !== 'boolean') return defaultValue;
		return value;
	}
	validateSettings() {
		// This function is called when the app is loaded
		const settings = this.settings;
		settings.pxPerSec = AppState.validateNumber(
			settings.pxPerSec,
			settingsRange.pxPerSec,
			defaultSettings.pxPerSec
		);
		settings.horizontalOverlap = AppState.validateNumber(
			settings.horizontalOverlap,
			settingsRange.horizontalOverlap,
			defaultSettings.horizontalOverlap
		);
		settings.pxPerLevel = AppState.validateNumber(
			settings.pxPerLevel,
			settingsRange.pxPerLevel,
			defaultSettings.pxPerLevel
		);
		settings.damageGroupInterval = AppState.validateNumber(
			settings.damageGroupInterval,
			settingsRange.damageGroupInterval,
			defaultSettings.damageGroupInterval
		);
		settings.showReceived = AppState.validateBoolean(
			settings.showReceived,
			defaultSettings.showReceived
		);
		settings.showMinor = AppState.validateBoolean(settings.showMinor, defaultSettings.showMinor);
		settings.pullStartAsReferenceTime = AppState.validateBoolean(
			settings.pullStartAsReferenceTime,
			defaultSettings.pullStartAsReferenceTime
		);
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
