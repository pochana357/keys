import type { PullRaw } from './wclTypes';
import ClassUtils from '$lib/utils/ClassUtils';
import { castDict, trackedIds, castBlackList } from '$lib/appData';
import Fights from '$lib/api/Fights.svelte';
import EventsLumped from '$lib/api/EventsLumped.svelte';
import { type FetchEventsOptions, fetchEventsWithCache } from '$lib/api/fetchEvents';
import type { EventType } from './apiAddr';

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
	async fetchPull(
		pull: PullRaw,
		options: {
			progressCallback?: (cur: number, st: number, ed: number) => void;
		} = {}
	) {
		const startTime = pull.start_time;
		const endTime = pull.end_time;

		const retrieveEvents = <T extends EventType>(eventType: T, options: FetchEventsOptions) =>
			fetchEventsWithCache(eventType, this.code, startTime, endTime, options).then((events) =>
				events.map((event) => ({
					...event,
					timestamp: event.timestamp,
					source: this.fights.findUnitRaw(event.sourceID, event.sourceIsFriendly),
					target: this.fights.findUnitRaw(event.targetID, event.targetIsFriendly)
				}))
			);

		const damageTakenEvents = await retrieveEvents('damageTaken', {
			// We filter out the melee attacks and other irrelvant damage events such as Shadow Word: Death and Symbiosis (Darkmoon).
			// Note that the spellid of the melee attack may not always be 1.
			filter: `(ability.id not in (${castBlackList.damages.join(',')}) and ability.name not in ("Melee")) or (overkill >= 0)`,
			progressCallback: options.progressCallback
		});
		const castEvents = (
			await retrieveEvents('casts', {
				filter: `ability.id in (${[...trackedIds.castsTracked.keys()].join(',')}) and type != "begincast"`,
				progressCallback: options.progressCallback
			})
		).filter((event) => {
			const castData = castDict[event.ability.guid];
			if (!castData) return false;
			if (
				castData.dpsOnly &&
				event.source &&
				(ClassUtils.isHeal(event.source) || ClassUtils.isTank(event.source))
			) {
				return false;
			}
			if (castData.healOnly && event.source && !ClassUtils.isHeal(event.source)) {
				return false;
			}
			if (castData.tankOnly && event.source && !ClassUtils.isTank(event.source)) {
				return false;
			}
			if (castData.nonTankOnly && event.source && ClassUtils.isTank(event.source)) {
				return false;
			}

			if (castData.selfCastOnly && event.sourceID !== event.targetID) return false;
			if (castData.friendlyTargetOnly && !event.targetIsFriendly) return false;
			return true;
		});

		const buffEvents = await retrieveEvents('buffs', {
			filter: `ability.id in (${[...trackedIds.buffsTracked.keys()].join(',')})`,
			progressCallback: options.progressCallback
		});
		const debuffEVents = await retrieveEvents('debuffs', {
			filter: `ability.id in (${[...trackedIds.debuffsTracked.keys()].join(',')})`,
			progressCallback: options.progressCallback
		});

		return new EventsLumped(damageTakenEvents, castEvents, buffEvents, debuffEVents, {
			startTime,
			endTime
		});
	}
}
