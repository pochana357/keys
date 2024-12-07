const apiPrefixV1 = 'https://www.warcraftlogs.com/v1/report';
export const wclApiKey = 'c2088b0955458285825ce7a51d9ac974';
export const apiAddr = {
	fights: (code: string) => `${apiPrefixV1}/fights/${code}`,
	events: {
		damageTaken: (code: string) => `${apiPrefixV1}/events/damage-taken/${code}`,
		casts: (code: string) => `${apiPrefixV1}/events/casts/${code}`,
		buffs: (code: string) => `${apiPrefixV1}/events/buffs/${code}`,
		debuffs: (code: string) => `${apiPrefixV1}/events/debuffs/${code}`
	}
} as const;

export type EventType = keyof typeof apiAddr.events;
