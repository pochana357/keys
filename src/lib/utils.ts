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
export class ClassUtils {
	static classColor(className: string) {
		return hexToRGB(classColors[className]);
	}
	static isPlayer(unit: UnitRaw) {
		return classColors[unit.type] !== undefined;
	}
}
