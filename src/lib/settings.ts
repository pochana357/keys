import { createSettings } from '$lib/localStorageWrapper.svelte';
import { setContext, getContext } from 'svelte';
import type Log from './api/log';

const defaultSettings = { ms2px: 10.0 };
type HistoryItem = {
	code: string;
	timestamp: number;
	exportedCharacters: string[];
};
const defaultHistory: { items: HistoryItem[] } = { items: [] };

export const OApiStatus = { busy: 'busy', failed: 'failed', succeeded: 'succeeded' } as const;
type ApiStatus = (typeof OApiStatus)[keyof typeof OApiStatus];
const maxHistory = 4;
const defaultApiStatus: { status: ApiStatus } = { status: OApiStatus.succeeded };

export class AppState {
	settings = createSettings(defaultSettings);
	history = createSettings(defaultHistory);
	api = createSettings(defaultApiStatus);

	constructor() {
		setContext('appSettings', this);
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
