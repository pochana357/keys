import ClassUtils from '$lib/utils/ClassUtils';
import type { CastEvent, DamageTakenEvent, UnitRaw } from './wclTypes';

export class EventsClass {
	damages: DamageTakenEvent[];
	casts: CastEvent[];
	players: Map<number, UnitRaw>;
	startTime: number;
	endTime: number;

	constructor(
		damages?: DamageTakenEvent[],
		casts?: CastEvent[],
		options: { startTime?: number; endTime?: number } = {}
	) {
		this.damages = damages ?? [];
		this.casts = casts ?? [];
		this.startTime = options.startTime ?? 0;
		this.endTime = this.startTime;

		this.players = new Map();
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
	clear() {
		this.damages = [];
		this.casts = [];
	}
}
