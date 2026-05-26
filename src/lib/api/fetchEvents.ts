import { readFromBuffer, writeToBuffer } from '$lib/localStorageWrapper.svelte';
import { apiAddr, type EventType } from './apiAddr';
import type { EventRaw } from './wclTypes';
import StringHash from '$lib/utils/hash';

export type FetchEventsOptions = Partial<{
	filter: string;
	suffix: string;
	referenceTime: number;
	progressCallback: (now: number, start: number, end: number) => void;
}>;

function getUrl(
	ApiAddress: string,
	apiKey: string,
	start: number,
	end: number,
	options: FetchEventsOptions
) {
	const queryString = new URLSearchParams({
		start: String(start),
		end: String(end),
		api_key: apiKey,
		translate: String(true)
	});
	if (options.filter) queryString.set('filter', options.filter);
	return `${ApiAddress}?${queryString.toString()}` + (options.suffix ? `&${options.suffix}` : '');
}
async function fetchEvents(
	ApiAddress: string,
	apiKey: string,
	start: number,
	end: number,
	options: FetchEventsOptions
) {
	// a general fetch function to fetch events from WCL API
	const events: Event[] = [];
	let st = start;
	options.progressCallback?.(st, start, end);
	while (true) {
		const url = getUrl(ApiAddress, apiKey, st, end, options);
		console.log('fetching events', ApiAddress, start, end);

		const response = await fetch(url);
		if (!response.ok) {
			const text = await response.text();
			console.warn('fetchEvents failed:', text);
			throw new Error(text);
		}
		const data = await response.json();

		for (const event of data.events) events.push(event);

		if ('nextPageTimestamp' in data) {
			st = data.nextPageTimestamp;
			options.progressCallback?.(st, start, end);
		} else {
			st = end;
			break;
		}
	}
	options.progressCallback?.(st, start, end);
	return events;
}

function isInvalidApiKeyError(err: unknown) {
	if (!(err instanceof Error)) return false;
	try {
		const parsed = JSON.parse(err.message) as { status?: number; error?: string };
		return parsed.status === 401 && parsed.error === 'Invalid key specified.';
	} catch {
		return false;
	}
}

export async function fetchEventsWithCache<T extends EventType>(
	eventType: T,
	code: string,
	apiKey: string,
	start: number,
	end: number,
	options: FetchEventsOptions
): Promise<EventRaw[T][]> {
	const url = getUrl(apiAddr.events[eventType](code), apiKey, start, end, options);
	const hash = StringHash.cyrb53(url);
	const cache = `${code}-${hash}`;
	const data = readFromBuffer(cache);
	if (data) {
		console.log(`${eventType} events loaded from the local cache;`, cache);
		return data as EventRaw[T][];
	}

	try {
		const time = Date.now();
		if (!apiKey) throw new Error('Warcraft Logs API key is required.');
		const events = await fetchEvents(apiAddr.events[eventType](code), apiKey, start, end, options);
		writeToBuffer(cache, events);
		const elapsedTime = Date.now() - time; // milliseconds
		console.log(`${eventType} events fetched from API;`, cache, `(${elapsedTime / 1000.0}s)`);
		return events as unknown as EventRaw[T][];
	} catch (err) {
		if (isInvalidApiKeyError(err)) throw err;
		console.warn(`${eventType} events fetch failed; returning empty result`, err);
		return [];
	}
}
