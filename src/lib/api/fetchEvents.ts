import { readFromBuffer, writeToBuffer } from '$lib/localStorageWrapper.svelte';
import { apiAddr, wclApiKey, type EventType } from './apiAddr';
import type { EventRaw } from './wclTypes';
import StringHash from '$lib/utils/hash';

export type FetchEventsOptions = Partial<{
	filter: string;
	suffix: string;
	referenceTime: number;
	progressCallback: (now: number, start: number, end: number) => void;
}>;

function getUrl(ApiAddress: string, start: number, end: number, options: FetchEventsOptions) {
	const queryString = new URLSearchParams({
		start: String(start),
		end: String(end),
		api_key: String(wclApiKey),
		translate: String(true)
	});
	if (options.filter) queryString.set('filter', options.filter);
	return `${ApiAddress}?${queryString.toString()}` + (options.suffix ? `&${options.suffix}` : '');
}
async function fetchEvents(
	ApiAddress: string,
	start: number,
	end: number,
	options: FetchEventsOptions
) {
	// a general fetch function to fetch events from WCL API
	const events: Event[] = [];
	let st = start;
	options.progressCallback?.(st, start, end);
	while (true) {
		const url = getUrl(ApiAddress, st, end, options);
		console.log('fetching', url);

		const response = await fetch(url);
		if (!response.ok) {
			console.log('fetchEvents failed:', await response.text());
			return events;
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

export async function fetchEventsWithCache<T extends EventType>(
	eventType: T,
	code: string,
	start: number,
	end: number,
	options: FetchEventsOptions
): Promise<EventRaw[T][]> {
	const url = getUrl(apiAddr.events[eventType](code), start, end, options);
	console.log(url);
	const hash = StringHash.cyrb53(url);
	const cache = `${code}-${hash}`;
	try {
		const data = readFromBuffer(cache);
		if (!data) throw new Error('cache empty');
		console.log(`${eventType} events loaded from the local cache;`, cache);
		return data as EventRaw[T][];
	} catch {
		const time = Date.now();
		const events = await fetchEvents(apiAddr.events[eventType](code), start, end, options);
		writeToBuffer(cache, events);
		const elapsedTime = Date.now() - time; // milliseconds
		console.log(`${eventType} events fetched from API;`, cache, `(${elapsedTime / 1000.0}s)`);
		return events as unknown as EventRaw[T][];
	}
}
