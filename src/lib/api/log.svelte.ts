import type { PullRaw, DamageTakenEvent, CastEvent } from './wclTypes';
import { formatTime } from '$lib/utils/utils';
import ClassUtils from '$lib/utils/ClassUtils';
import { blackList } from './spellData';
import defensiveSpells from './defensiveData';
import Fights from '$lib/api/fights.svelte';
import { EventsClass } from '$lib/api/event.svelte';
import {
	fetchDamageTakenEvents,
	fetchCastEvents,
	type FetchEventsOptions
} from '$lib/api/fetchEvents';

export default class Log {
	code = $state('');
	fights = $state(new Fights());
	exportedCharacters: string[] = $state([]);
	constructor(code: string, fights?: Fights) {
		this.code = code;
		if (code && fights) {
			this.fights = fights;
			this.exportedCharacters =
				fights?.json?.exportedCharacters?.map((character) => character.name) ?? [];
		}
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

		const referenceTime = options.referenceTime ?? startTime;
		const events: CastEvent[] = [];
		for (const event of castEvents) {
			// skip `begincast` events
			if (event.type !== 'cast') continue;
			const defensiveSpell = defensiveSpells[event.ability.guid];
			if (!defensiveSpell) continue;

			const source = this.fights.findUnitRaw(event.sourceID, event.sourceIsFriendly);
			const target = this.fights.findUnitRaw(event.targetID, event.targetIsFriendly);

			if (
				defensiveSpell.dpsOnly &&
				source &&
				(ClassUtils.isHeal(source) || ClassUtils.isTank(source))
			) {
				continue;
			}
			if (defensiveSpell.selfCastOnly && event.sourceID !== event.targetID) continue;
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
				source,
				target
			});
		}
		return events;
	}

	getDungeonPull(fightIdx: number, dungeonPullIdx: number) {
		// If the pair of fightIdx and dungeonPullIdx denotes a valid M+ pull,
		// returns the corresponding fightPullRaw and dungeonPullRaw.

		const fightPullRaws = this.fights?.json?.fights;
		if (fightPullRaws && fightIdx >= 0 && dungeonPullIdx >= 0) {
			const fightPullRaw = fightPullRaws[fightIdx];
			if (fightPullRaw && Fights.ValidateFight(fightPullRaw)) {
				const dungeonPullRaw = fightPullRaw.dungeonPulls[dungeonPullIdx];
				if (dungeonPullRaw) {
					// valid M+ pull
					return { fightPullRaw, dungeonPullRaw };
				}
			}
		}
		return null;
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
