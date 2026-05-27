import { CliError, exitCodes } from './errors.mjs';
import { buildUrl, requestJson, writeDiagnostic } from './http.mjs';

export const reportPrefix = 'https://www.warcraftlogs.com/v1/report';
export const eventTypes = ['damage-taken', 'casts', 'buffs', 'debuffs'];

export async function fetchFights(apiKey, code, logger) {
  return requestJson(
    buildUrl(`${reportPrefix}/fights/${code}`, {
      api_key: apiKey,
      translate: true,
    }),
    'report fights',
    logger,
  );
}

export async function fetchEvents(
  apiKey,
  code,
  eventType,
  start,
  end,
  options = {},
) {
  const events = [];
  let pageStart = start;
  let pages = 0;

  while (true) {
    pages += 1;
    const url = buildUrl(`${reportPrefix}/events/${eventType}/${code}`, {
      start: pageStart,
      end,
      api_key: apiKey,
      translate: true,
      filter: options.filter,
    });
    const data = await requestJson(
      url,
      `${eventType} page ${pages}`,
      options.logger,
    );
    if (Array.isArray(data?.events)) {
      events.push(...data.events);
    }

    if (data?.nextPageTimestamp === undefined) break;
    pageStart = data.nextPageTimestamp;
  }

  writeDiagnostic(
    options.logger,
    `[events] ${eventType}: pages=${pages} ${summarizeEvents(events)}`,
  );
  return events;
}

export function selectPull(fights, fightIndex, pullIndex) {
  const fight = fights?.[fightIndex];
  if (!fight) {
    throw new CliError(
      `Fight index ${fightIndex} is out of range`,
      exitCodes.selection,
    );
  }

  if (!Array.isArray(fight.dungeonPulls)) {
    throw new CliError(
      `Fight index ${fightIndex} has no dungeonPulls`,
      exitCodes.selection,
    );
  }

  const pull = fight.dungeonPulls[pullIndex];
  if (!pull) {
    throw new CliError(
      `Pull index ${pullIndex} is out of range for fight index ${fightIndex}`,
      exitCodes.selection,
    );
  }

  return { fight, pull };
}

function summarizeEvents(events) {
  if (events.length === 0) {
    return 'count=0 firstTimestamp=(none) lastTimestamp=(none)';
  }

  return [
    `count=${events.length}`,
    `firstTimestamp=${events[0].timestamp ?? '(unknown)'}`,
    `lastTimestamp=${events[events.length - 1].timestamp ?? '(unknown)'}`,
  ].join(' ');
}
