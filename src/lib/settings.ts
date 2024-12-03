import { createSettings } from '$lib/localStorageWrapper.svelte';
import { setContext, getContext } from 'svelte';

const defaultSettings = { ms2px: 10.0 };
const defaultHistory: { codes: string[] } = { codes: [] };

export const OApiStatus = { busy: 'busy', failed: 'failed', succeeded: 'succeeded' } as const;
type ApiStatus = (typeof OApiStatus)[keyof typeof OApiStatus];

const defaultApiStatus: { status: ApiStatus } = { status: OApiStatus.succeeded };
const maxHistory = 5;
export class AppState {
	settings = createSettings(defaultSettings);
	history = createSettings(defaultHistory);
	api = createSettings(defaultApiStatus);

	constructor() {
		setContext('appSettings', this);
	}

	pushCode(code: string) {
		const newCodes = this.history.codes.filter((c) => c !== code);
		newCodes.push(code);
		this.history.codes = newCodes.length <= maxHistory ? newCodes : newCodes.slice(1);
	}
	isBusy() {
		return this.api.status === OApiStatus.busy;
	}
}
export function getAppState() {
	return getContext('appSettings') as AppState;
}
