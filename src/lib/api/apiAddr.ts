const apiPrefixV1 = 'https://www.warcraftlogs.com/v1/report';
export const wclApiKey = 'REDACTED_WCL_API_KEY';
export const apiAddr = {
	fights: (code: string) => `${apiPrefixV1}/fights/${code}`,
	events: {
		damageTaken: (code: string) => `${apiPrefixV1}/events/damage-taken/${code}`,
		casts: (code: string) => `${apiPrefixV1}/events/casts/${code}`
	}
} as const;

export type EventTypes = keyof typeof apiAddr.events;
