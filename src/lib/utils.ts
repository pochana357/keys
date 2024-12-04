import type { UnitRaw } from './api/wclTypes';

export function formatTime(timestamp: number, referenceTimestamp: number = 0, digits: number = 3) {
	const seconds = (timestamp - referenceTimestamp) / 1000.0;
	const minutes = Math.floor(seconds / 60);
	const remainder = seconds - minutes * 60;
	const secondsStr = String(remainder.toFixed(digits)).padStart(
		2 + digits + (digits > 0 ? 1 : 0),
		'0'
	);
	return `${minutes}:${secondsStr}`;
}

export function formatAbsoluteTime(timestamp: number) {
	// from a UNIX timestamp to local time
	const date = new Date(timestamp);
	return date.toLocaleString();
}

function hexToRGB(hex: string) {
	// input: string '#RRGGBB'
	try {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);

		return `rgb(${r}, ${g}, ${b})`;
	} catch {
		return 'rgb(128, 128, 128)';
	}
}
const classColors: { [className: string]: string } = {
	DeathKnight: '#C41E3A',
	DemonHunter: '#A330C9',
	Druid: '#FF7C0A',
	Evoker: '#33937F',
	Hunter: '#AAD372',
	Mage: '#3FC7EB',
	Monk: '#00FF98',
	Paladin: '#F48CBA',
	Priest: '#FFFFFF',
	Rogue: '#FFF468',
	Shaman: '#0070DD',
	Warlock: '#8788EE',
	Warrior: '#C69B6D'
};
const ORole = {
	tank: 'TANK',
	heal: 'HEAL',
	dps: 'DPS'
} as const;
export type Role = (typeof ORole)[keyof typeof ORole];
const classSpec2Role: Record<string, Role> = {
	'DeathKnight-Blood': ORole.tank,
	'DeathKnight-Frost': ORole.dps,
	'DeathKnight-Unholy': ORole.dps,

	'DemonHunter-Havoc': ORole.dps,
	'DemonHunter-Vengeance': ORole.tank,

	'Druid-Balance': ORole.dps,
	'Druid-Feral': ORole.dps,
	'Druid-Guardian': ORole.tank,
	'Druid-Restoration': ORole.heal,

	'Evoker-Augmentation': ORole.dps,
	'Evoker-Devastation': ORole.dps,
	'Evoker-Preservation': ORole.heal,

	'Hunter-BeastMastery': ORole.dps,
	'Hunter-Marksmanship': ORole.dps,
	'Hunter-Survival': ORole.dps,

	'Mage-Arcane': ORole.dps,
	'Mage-Fire': ORole.dps,
	'Mage-Frost': ORole.dps,

	'Monk-Brewmaster': ORole.tank,
	'Monk-Mistweaver': ORole.heal,
	'Monk-Windwalker': ORole.dps,

	'Paladin-Holy': ORole.heal,
	'Paladin-Protection': ORole.tank,
	'Paladin-Retribution': ORole.dps,

	'Priest-Discipline': ORole.heal,
	'Priest-Holy': ORole.heal,
	'Priest-Shadow': ORole.dps,

	'Rogue-Assassination': ORole.dps,
	'Rogue-Outlaw': ORole.dps,
	'Rogue-Subtlety': ORole.dps,

	'Shaman-Elemental': ORole.dps,
	'Shaman-Enhancement': ORole.dps,
	'Shaman-Restoration': ORole.heal,

	'Warlock-Affliction': ORole.dps,
	'Warlock-Demonology': ORole.dps,
	'Warlock-Destruction': ORole.dps,

	'Warrior-Arms': ORole.dps,
	'Warrior-Fury': ORole.dps,
	'Warrior-Protection': ORole.tank
};
export class ClassUtils {
	static classColor(className: string) {
		return hexToRGB(classColors[className]);
	}
	static isPlayer(unit: UnitRaw) {
		return classColors[unit.type] !== undefined;
	}
	static isDps(unit: UnitRaw) {
		return unit.icon && classSpec2Role[unit.icon] === ORole.dps;
	}
	static isTank(unit: UnitRaw) {
		return unit.icon && classSpec2Role[unit.icon] === ORole.tank;
	}
	static isHeal(unit: UnitRaw) {
		return unit.icon && classSpec2Role[unit.icon] === ORole.heal;
	}
}
