import Fights from './fights';
import type {
	PullRaw,
	DamageTakenEventRaw,
	CastEventRaw,
	DamageTakenEvent,
	CastEvent
} from './wclTypes';
import { apiAddr, wclApiKey } from './apiAddr';
import { formatTime } from '$lib/utils';
import { blackList } from './spellData';
import defensiveData from './defensiveData';
import { readFromBuffer, writeToBuffer } from '$lib/localStorageWrapper.svelte';
import { EventsClass } from './event';

type FetchEventsOptions = Partial<{
	filter: string;
	suffix: string;
	verbose: boolean;
	referenceTime: number;
	progressCallback: (now: number, start: number, end: number) => void;
}>;

async function fetchEvents(
	ApiAddress: string,
	start: number,
	end: number,
	options: FetchEventsOptions
) {
	// a general fetch function to fetch events from WCL API
	const queryString = new URLSearchParams({
		start: String(start),
		end: String(end),
		api_key: String(wclApiKey),
		translate: String(true)
	});
	if (options.filter) queryString.set('filter', options.filter);
	const events: Event[] = [];
	let st = start;
	options.progressCallback?.(st, start, end);
	while (true) {
		queryString.set('start', String(st));
		const url =
			`${ApiAddress}?${queryString.toString()}` + (options.suffix ? `&${options.suffix}` : '');
		console.log('fetching', url);

		const response = await fetch(url);
		if (!response.ok) {
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

async function fetchDamageTakenEvents(
	code: string,
	start: number,
	end: number,
	options: FetchEventsOptions
): Promise<DamageTakenEventRaw[]> {
	const cache = `damageTaken-${code}-${start}-${end}`;
	try {
		const data = readFromBuffer(cache);
		if (!data) throw new Error('cache empty');
		console.log('fetchDamageTakenEvents loaded from cache;', cache);
		return data as DamageTakenEventRaw[];
	} catch {
		const events = await fetchEvents(apiAddr.events.damageTaken(code), start, end, options);
		writeToBuffer(cache, events);
		console.log('fetchDamageTakenEvents loaded from API;', cache);
		return events as unknown as DamageTakenEventRaw[];
	}
}
async function fetchCastEvents(
	code: string,
	start: number,
	end: number,
	options: FetchEventsOptions
): Promise<CastEventRaw[]> {
	const cache = `cast-${code}-${start}-${end}`;
	try {
		const data = readFromBuffer(cache);
		if (!data) throw new Error('cache empty');
		console.log('fetchCastEvents loaded from cache;', cache);
		return data as CastEventRaw[];
	} catch {
		const events = await fetchEvents(apiAddr.events.cast(code), start, end, options);
		writeToBuffer(cache, events);
		console.log('fetchCastEvents loaded from API;', cache);
		return events as unknown as CastEventRaw[];
	}
}

export default class Log {
	code: string;
	fights: Fights;
	exportedCharacters: string[];
	constructor(code: string, fights: Fights) {
		this.code = code;
		this.fights = fights;
		this.exportedCharacters =
			fights?.json?.exportedCharacters?.map((character) => character.name) ?? [];
	}
	static async build(code: string) {
		const fights = await Fights.fetchFights(code);
		return new Log(code, fights);
	}
	async damageTakenEvents(startTime: number, endTime: number, options: FetchEventsOptions) {
		const damageTaken = await fetchDamageTakenEvents(this.code, startTime, endTime, options);
		const referenceTime = options.referenceTime ?? startTime;

		const events: DamageTakenEvent[] = [];

		for (const event of damageTaken) {
			if (options.verbose) {
				const source = this.fights.findUnitRaw(event.sourceID, event.sourceIsFriendly);
				const target = this.fights.findUnitRaw(event.targetID, event.targetIsFriendly);
				console.log(
					formatTime(event.timestamp, startTime),
					source?.icon ?? source?.name,
					'▶',
					target?.icon ?? target?.name
				);
				console.log(
					'  ',
					`${event.ability.name} (${event.ability.guid})`,
					`${event.amount}` + (event.absorbed ? ` (A: ${event.absorbed})` : ''),
					`remaining: ${event.hitPoints}/${event.maxHitPoints}`
				);
			}
			events.push({
				...event,
				timestamp: event.timestamp - referenceTime,
				source: this.fights.findUnitRaw(event.sourceID, event.sourceIsFriendly),
				target: this.fights.findUnitRaw(event.targetID, event.targetIsFriendly)
			});
		}
		return events;
	}
	async castEvents(startTime: number, endTime: number, options: FetchEventsOptions) {
		const castEvents = await fetchCastEvents(this.code, startTime, endTime, options);
		const SetspellsTracked = new Set(defensiveData);
		const referenceTime = options.referenceTime ?? startTime;
		const events: CastEvent[] = [];
		for (const event of castEvents) {
			// skip `begincast` events
			if (event.type !== 'cast') continue;
			const flag = SetspellsTracked.has(event.ability.guid);
			if (!flag) continue;
			if (options.verbose) {
				console.log(
					formatTime(event.timestamp, referenceTime),
					this.fights.findUnitRaw(event.sourceID, event.sourceIsFriendly)?.name,
					'▶',
					this.fights.findUnitRaw(event.targetID, event.targetIsFriendly)?.name
				);
				console.log('  ', `${event.ability.name} (${event.ability.guid})`);
			}
			events.push({
				...event,
				timestamp: event.timestamp - referenceTime,
				source: this.fights.findUnitRaw(event.sourceID, event.sourceIsFriendly),
				target: this.fights.findUnitRaw(event.targetID, event.targetIsFriendly)
			});
		}
		return events;
	}

	async analyzePull(
		pull: PullRaw,
		options: {
			verbose?: boolean;
			progressCallback?: (cur: number, st: number, ed: number) => void;
		} = {}
	) {
		const startTime = pull.start_time;
		const endTime = pull.end_time;

		// The spellid of the melee attack may not be 1.
		const damageTakenEvents = await this.damageTakenEvents(startTime, endTime, {
			filter: `ability.id not in (${blackList.damages.join(',')}) and ability.name not in ("Melee")`,
			verbose: options.verbose,
			progressCallback: options.progressCallback
		});
		const castEvents = await this.castEvents(startTime, endTime, {
			verbose: options.verbose,
			progressCallback: options.progressCallback
		});
		return new EventsClass(damageTakenEvents, castEvents, {
			startTime: 0,
			endTime: endTime - startTime
		});
	}
}
