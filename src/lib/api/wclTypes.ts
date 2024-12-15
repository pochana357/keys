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
export type MplusPullRaw = PullRaw & {
	zoneID: number;
	zoneName: string;
	keystoneLevel: number;
	dungeonPulls: DungeonPullRaw[];
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
	type: number;
	abilityIcon: string;
};
export type EventRawBase = {
	timestamp: number;
	type: string;
	sourceID: number | UnitRaw;
	sourceIsFriendly: number;
	targetID: number | UnitRaw;
	targetIsFriendly: number;
	ability: Ability;
};
export type DamageTakenEventRaw = EventRawBase & {
	buffs: string;
	hitType: number;
	amount: number;
	absorbed: number;
	hitPoints?: number;
	maxHitPoints?: number;
	overkill?: number;
	versatility: number;
	avoidance: number;
};
export type CastEventRaw = EventRawBase;
export type BuffEventRaw = EventRawBase;
export type DebuffEventRaw = EventRawBase;

export type GeneralEventRaw = EventRawBase & { source: UnitRaw | null; target: UnitRaw | null };
export type EventRaw = {
	damageTaken: DamageTakenEventRaw;
	casts: CastEventRaw;
	buffs: BuffEventRaw;
	debuffs: DebuffEventRaw;
};

type UnitsResolved = {
	source: UnitRaw | null;
	target: UnitRaw | null;
};
export type DamageTakenEvent = DamageTakenEventRaw & UnitsResolved;
export type CastEvent = CastEventRaw & UnitsResolved;
export type BuffEvent = BuffEventRaw & UnitsResolved;
export type DebuffEvent = DebuffEventRaw & UnitsResolved;
