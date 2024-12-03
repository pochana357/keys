export type UnitRaw = {
	name: string;
	id: number;
	guid: number;
	type: string;
	icon: string;
};
export type PullRaw = {
	id: number;
	boss: number;
	start_time: number;
	end_time: number;
	name: string;
};
export type DungeonPullRaw = PullRaw;
export type FightPullRaw = PullRaw & {
	zoneID: number;
	zoneName: string;
	keystoneLevel?: number;
	dungeonPulls?: DungeonPullRaw[];
};
type ExportedCharacter = {
	id: number;
	name: string;
	server: string;
	region: string;
};
export type FightsRaw = {
	friendlies: UnitRaw[];
	enemies: UnitRaw[];
	friendlyPets: UnitRaw[];
	enemyPets: UnitRaw[];
	fights: FightPullRaw[];
	title: string;
	owner: string;
	start: number;
	end: number;
	exportedCharacters: ExportedCharacter[];
};
export type BossPull = {
	pull: DungeonPullRaw;
	fight: FightPullRaw;
};

export type Ability = {
	name: string;
	guid: number;
	abilityIcon: string;
};
export type EventRaw = {
	timestamp: number;
	type: string;
	sourceID: number | UnitRaw;
	sourceIsFriendly: number;
	targetID: number | UnitRaw;
	targetIsFriendly: number;
	ability: Ability;
};
export type DamageTakenEventRaw = EventRaw & {
	buffs: string;
	hitType: number;
	amount: number;
	absorbed: number;
	hitPoints?: number;
	maxHitPoints?: number;
};
export type CastEventRaw = EventRaw;
export type GeneralEvent = EventRaw & { source: UnitRaw | null; target: UnitRaw | null };
export type DamageTakenEvent = DamageTakenEventRaw & {
	source: UnitRaw | null;
	target: UnitRaw | null;
};
export type CastEvent = CastEventRaw & { source: UnitRaw | null; target: UnitRaw | null };
