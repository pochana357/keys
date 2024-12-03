import { browser } from '$app/environment';

const apiCache = new Map<string, object>();
export function readFromBuffer(key: string): unknown | null {
	try {
		const data = apiCache.get(key);
		return data ?? null;
	} catch {
		return null;
	}
}
export function writeToBuffer(key: string, data: object) {
	apiCache.set(key, data);
}

export const localStorageWrapper = {
	set<T>(key: string, val: T) {
		if (browser) localStorage.setItem(key, JSON.stringify(val));
	},
	get<T>(key: string, defaultVal: T): T {
		if (browser) {
			const resultRaw = localStorage.getItem(key);
			if (resultRaw === null) {
				// key doesn't exist
				return defaultVal;
			}
			try {
				const result = JSON.parse(resultRaw);
				return result as T;
			} catch {
				return defaultVal;
			}
		} else return defaultVal;
	}
};

export function createSettings<T extends object>(defaultSettings_: T) {
	const settings = $state(defaultSettings_);

	for (const key of Object.keys(settings)) {
		// @ts-expect-error permit any
		settings[key] = localStorageWrapper.get(`settings.${key}`, settings[key]);
		// @ts-expect-error permit any
		$effect(() => localStorageWrapper.set(`settings.${key}`, settings[key]));
	}

	return settings;
}
