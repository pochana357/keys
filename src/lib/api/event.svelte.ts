import ClassUtils from '$lib/utils/ClassUtils';
import { SvelteMap } from 'svelte/reactivity';
import type { BuffEvent, CastEvent, DamageTakenEvent, DebuffEvent, UnitRaw } from './wclTypes';

export class EventsLumped {
	damages: DamageTakenEvent[] = $state([]);
	casts: CastEvent[] = $state([]);
	buffs: BuffEvent[] = $state([]);
	debuffs: DebuffEvent[] = $state([]);
	players: SvelteMap<number, UnitRaw> = $state(new SvelteMap()); // Why here?
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

		for (const events of [this.damages, this.casts]) {
			for (const event of events) {
				if (event.source && ClassUtils.isPlayer(event.source)) {
					this.players.set(event.source.id, event.source);
					if (this.endTime < event.timestamp) {
						this.endTime = event.timestamp;
					}
				}
				if (event.target && ClassUtils.isPlayer(event.target)) {
					this.players.set(event.target.id, event.target);
					if (this.endTime < event.timestamp) {
						this.endTime = event.timestamp;
					}
				}
			}
		}
		this.endTime = options.endTime ?? this.endTime;
	}
}
