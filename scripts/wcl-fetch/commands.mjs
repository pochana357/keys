import fs from 'node:fs';
import path from 'node:path';
import {
  assertCode,
  assertEventType,
  assertNoUnexpectedArgs,
  getCode,
  getPullSelection,
  parseArgs,
  parseExplicitRange,
  usage,
} from './args.mjs';
import { CliError, exitCodes } from './errors.mjs';
import { loadApiKey } from './env.mjs';
import { buildUrl, requestJson } from './http.mjs';
import { eventTypes, fetchEvents, fetchFights, selectPull } from './wcl.mjs';

function formatMs(milliseconds) {
  const seconds = milliseconds / 1000;
  return `${seconds.toFixed(3)}s`;
}

function printSelection(report, fightIndex, pullIndex, fight, pull) {
  console.log('');
  console.log('[report]');
  console.log(`title: ${report.title ?? '(unknown)'}`);
  console.log(
    `fights: ${Array.isArray(report.fights) ? report.fights.length : 0}`,
  );
  console.log('');
  console.log('[selection]');
  console.log(`fightIndex: ${fightIndex}`);
  console.log(`fightId: ${fight.id ?? '(unknown)'}`);
  console.log(`zone: ${fight.zoneName ?? '(unknown)'}`);
  console.log(`keystoneLevel: ${fight.keystoneLevel ?? '(none)'}`);
  console.log(`pullIndex: ${pullIndex}`);
  console.log(`displayPull: ${pullIndex + 1}`);
  console.log(`pullName: ${pull.name ?? '(unknown)'}`);
  console.log(`pullBoss: ${pull.boss ?? '(none)'}`);
  console.log(`pullStart: ${pull.start_time}`);
  console.log(`pullEnd: ${pull.end_time}`);
  console.log(`pullDuration: ${formatMs(pull.end_time - pull.start_time)}`);
  console.log('');
}

function outputJson(data, outPath) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  if (outPath) {
    const resolved = path.resolve(process.cwd(), outPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, json);
  } else {
    process.stdout.write(json);
  }
}

async function resolveEventRange(apiKey, code, args, logger) {
  const explicit = parseExplicitRange(args);
  const hasPullSelection =
    args.url !== undefined ||
    args.fight !== undefined ||
    args.pull !== undefined;

  if (explicit && hasPullSelection) {
    throw new CliError(
      'Use either --start/--end or pull selection arguments, not both.',
      exitCodes.usage,
    );
  }

  if (explicit) return explicit;

  const { fight: fightIndex, pull: pullIndex } = getPullSelection(args);
  const report = await fetchFights(apiKey, code, logger);
  const { pull } = selectPull(report.fights, fightIndex, pullIndex);
  return { start: pull.start_time, end: pull.end_time };
}

async function runFights(args) {
  assertNoUnexpectedArgs(args, ['help', 'code', 'url', 'out']);

  const code = getCode(args);
  assertCode(code);

  const { apiKey } = loadApiKey();
  const report = await fetchFights(apiKey, code, console.error);
  outputJson(report, args.out);
}

async function runEvents(args) {
  assertNoUnexpectedArgs(args, [
    'help',
    'type',
    'code',
    'url',
    'start',
    'end',
    'fight',
    'pull',
    'filter',
    'out',
  ]);

  const code = getCode(args);
  assertCode(code);
  assertEventType(args.type);

  const { apiKey } = loadApiKey();
  const range = await resolveEventRange(apiKey, code, args, console.error);
  const events = await fetchEvents(
    apiKey,
    code,
    args.type,
    range.start,
    range.end,
    {
      filter: args.filter,
      logger: console.error,
    },
  );
  outputJson(events, args.out);
}

async function runDoctor(args) {
  assertNoUnexpectedArgs(args, ['help', 'code', 'url', 'fight', 'pull']);

  const code = getCode(args);
  assertCode(code);

  const { apiKey, envPath } = loadApiKey();
  const { fight: fightIndex, pull: pullIndex } = getPullSelection(args);

  console.log('[input]');
  console.log(`code: ${code}`);
  console.log(`fightIndex: ${fightIndex}`);
  console.log(`pullIndex: ${pullIndex}`);
  console.log(`env: ${envPath}`);
  console.log('');

  await requestJson(
    buildUrl('https://www.warcraftlogs.com/v1/classes', { api_key: apiKey }),
    'key validation',
    console.log,
  );

  const report = await fetchFights(apiKey, code, console.log);
  const { fight, pull } = selectPull(report.fights, fightIndex, pullIndex);
  printSelection(report, fightIndex, pullIndex, fight, pull);

  for (const eventType of eventTypes) {
    await fetchEvents(apiKey, code, eventType, pull.start_time, pull.end_time, {
      logger: console.log,
    });
  }
}

export async function main(argv) {
  const { command, args } = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return;
  }

  if (command === 'fights') {
    await runFights(args);
    return;
  }
  if (command === 'events') {
    await runEvents(args);
    return;
  }
  await runDoctor(args);
}
