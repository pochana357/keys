import { readFromBuffer, writeToBuffer } from '$lib/localStorageWrapper.svelte.js';
import { apiAddr, wclApiKey } from './apiAddr.js';
import type { FightPullRaw, FightsRaw, UnitRaw, MplusPullRaw } from './wclTypes.js';

function parseUnits(units: UnitRaw[]) {
	if (!units) {
		throw new Error('No units provided');
	}
	const unitMap: { [id: number]: UnitRaw } = {};
	for (const unit of units) {
		if (!unit.id) continue;
		unitMap[unit.id] = unit;
	}
	return unitMap;
}
export default class Fights {
	json: FightsRaw | null = $state(null);
	friendlies: { [id: number]: UnitRaw } = $state({});
	enemies: { [id: number]: UnitRaw } = $state({});
	friendlyPets: { [id: number]: UnitRaw } = $state({});
	enemyPets: { [id: number]: UnitRaw } = $state({});

	constructor(fightsRaw?: FightsRaw) {
		if (fightsRaw) {
			this.json = fightsRaw;
			this.friendlies = parseUnits(fightsRaw.friendlies);
			this.enemies = parseUnits(fightsRaw.enemies);
			this.friendlyPets = parseUnits(fightsRaw.friendlyPets);
			this.enemyPets = parseUnits(fightsRaw.enemyPets);
		}
	}
	getFightIdx(fightId: number) {
		return this.json?.fights.findIndex((fight) => fight.id === fightId) ?? -1;
	}
	getDungeonPullIdx(fightId: number, pullId: number) {
		const fightIdx = this.getFightIdx(fightId);
		if (fightIdx === -1) return -1;
		const pull = this.json?.fights[fightIdx].dungeonPulls;
		if (!pull) return -1;
		return pull.findIndex((pull) => pull.id === pullId);
	}
	static ValidateFight(fight: FightPullRaw): fight is MplusPullRaw {
		return fight.keystoneLevel !== undefined && fight.dungeonPulls !== undefined;
	}

	findUnitRaw(idOrEnvUnit: number | UnitRaw, unitIsFriendly: number): UnitRaw | null {
		if (typeof idOrEnvUnit !== 'number') return idOrEnvUnit;
		if (unitIsFriendly) {
			let unit = this.friendlies[idOrEnvUnit];
			if (!unit) unit = this.friendlyPets[idOrEnvUnit];
			return unit ?? null;
		} else {
			let unit = this.enemies[idOrEnvUnit];
			if (!unit) unit = this.enemyPets[idOrEnvUnit];
			return unit ?? null;
		}
	}
	static async fetchFights(code: string) {
		// fetch fights data from WCL API or from cache
		const key = `fights-${code}`;
		try {
			const data = readFromBuffer(key) as FightsRaw;
			if (!data) throw new Error('Cache empty');
			return new Fights(data);
		} catch {
			const queryString = new URLSearchParams({ api_key: wclApiKey, translate: String(true) });
			const url = apiAddr.fights(code) + `?${queryString.toString()}`;
			console.log('fetching', url);
			const response = await fetch(url);
			if (!response.ok) {
				const text = await response.text();
				throw new Error(text);
			} else {
				const data = await response.json();
				writeToBuffer(key, data);
				return new Fights(data);
			}
		}
	}
}
