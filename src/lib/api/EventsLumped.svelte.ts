import ClassUtils from '$lib/utils/ClassUtils';
import type { BuffEvent, CastEvent, DamageTakenEvent, DebuffEvent, UnitRaw } from './wclTypes';

export default class EventsLumped {
	// The class `EventsLumped` denotes all events corresponding to a pull.
	damages: DamageTakenEvent[] = $state([]);
	casts: CastEvent[] = $state([]);
	buffs: BuffEvent[] = $state([]);
	debuffs: DebuffEvent[] = $state([]);
	players: UnitRaw[] = $state([]); // List of all friendly players engaged
	startTime = $state(0);
	endTime = $state(0);

	constructor(
		damageEvents?: DamageTakenEvent[],
		castEvents?: CastEvent[],
		buffEvents?: CastEvent[],
		debuffEvents?: CastEvent[],
		options: { startTime?: number; endTime?: number } = {}
	) {
		this.damages = damageEvents ?? [];
		this.casts = castEvents ?? [];
		this.buffs = buffEvents ?? [];
		this.debuffs = debuffEvents ?? [];
		this.startTime = options.startTime ?? 0;
		this.endTime = this.startTime;

		const playersMap: { [id: number]: UnitRaw } = {};

		// 1. Collect all players engaged in the pull
		// 2. Calculate the endTime of the pull
		for (const events of [this.damages, this.casts, this.buffs, this.debuffs]) {
			for (const event of events) {
				for (const unit of [event.source, event.target]) {
					if (unit && ClassUtils.isPlayer(unit) && !playersMap[unit.id]) {
						playersMap[unit.id] = unit;
					}
				}
				if (this.endTime < event.timestamp) {
					this.endTime = event.timestamp;
				}
			}
		}
		this.players = Object.values(playersMap).toSorted((a, b) => {
			const roleDiff = String(ClassUtils.role(a)).localeCompare(String(ClassUtils.role(b)));
			return roleDiff !== 0 ? roleDiff : a.icon.localeCompare(b.icon);
		});
		this.endTime = options.endTime ?? this.endTime;
	}
}
