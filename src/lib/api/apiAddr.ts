const apiPrefixV1 = 'https://www.warcraftlogs.com/v1/report';
export const wclApiKey = 'c2088b0955458285825ce7a51d9ac974';
export const apiAddr = {
  fights: (code: string) => `${apiPrefixV1}/fights/${code}`,
  events: {
    damageTaken: (code: string) => `${apiPrefixV1}/events/damage-taken/${code}`,
    cast: (code: string) => `${apiPrefixV1}/events/casts/${code}`,
  },
};
