import { CliError, exitCodes } from './errors.mjs';
import { eventTypes } from './wcl.mjs';

const commands = ['doctor', 'fights', 'events'];

export function usage() {
  return [
    'Usage:',
    '  npm run wcl:fetch -- fights --code RMK6vq912F4xVTPN',
    '  npm run wcl:fetch -- events --type damage-taken --code RMK6vq912F4xVTPN --start 5357834 --end 5576773',
    '  npm run wcl:fetch -- events --type casts --url "http://localhost:5173/?code=RMK6vq912F4xVTPN&fight=8&pull=6"',
    '  npm run wcl:fetch -- doctor --url "http://localhost:5173/?code=RMK6vq912F4xVTPN&fight=8&pull=6"',
    '  npm run wcl:fetch -- --url "http://localhost:5173/?code=RMK6vq912F4xVTPN&fight=8&pull=6"',
  ].join('\n');
}

export function parseArgs(argv) {
  const args = {};
  let command = 'doctor';
  let index = 0;

  if (commands.includes(argv[0])) {
    command = argv[0];
    index = 1;
  }

  for (let i = index; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }
    if (!arg.startsWith('--')) {
      throw new CliError(
        `Unexpected argument: ${arg}\n\n${usage()}`,
        exitCodes.usage,
      );
    }

    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new CliError(
        `Missing value for --${key}\n\n${usage()}`,
        exitCodes.usage,
      );
    }
    args[key] = value;
    i += 1;
  }

  return { command, args };
}

function getUrlParams(urlString) {
  try {
    return new URL(urlString).searchParams;
  } catch (error) {
    throw new CliError(`Invalid --url: ${error.message}`, exitCodes.usage);
  }
}

export function getCode(args) {
  if (args.url) return getUrlParams(args.url).get('code');
  return args.code;
}

export function getPullSelection(args) {
  if (args.url) {
    const params = getUrlParams(args.url);
    return {
      fight: parseIndex(params.get('fight'), 'fight'),
      pull: parseIndex(params.get('pull'), 'pull'),
    };
  }

  return {
    fight: parseIndex(args.fight, 'fight'),
    pull: parseIndex(args.pull, 'pull'),
  };
}

function parseIndex(value, name) {
  if (value === undefined || value === null || value === '') {
    throw new CliError(
      `Missing required ${name} index\n\n${usage()}`,
      exitCodes.usage,
    );
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new CliError(
      `${name} must be a zero-based non-negative integer: ${value}`,
      exitCodes.usage,
    );
  }
  return parsed;
}

function parseTimestamp(value, name) {
  if (value === undefined || value === null || value === '') {
    throw new CliError(`Missing required ${name}`, exitCodes.usage);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new CliError(
      `${name} must be a non-negative integer timestamp: ${value}`,
      exitCodes.usage,
    );
  }
  return parsed;
}

export function assertCode(code) {
  if (!code || code.length < 5) {
    throw new CliError(
      `Missing or invalid report code: ${code ?? ''}`,
      exitCodes.usage,
    );
  }
}

export function assertEventType(eventType) {
  if (!eventTypes.includes(eventType)) {
    throw new CliError(
      `--type must be one of ${eventTypes.join(', ')}: ${eventType ?? ''}`,
      exitCodes.usage,
    );
  }
}

export function assertNoUnexpectedArgs(args, allowed) {
  for (const key of Object.keys(args)) {
    if (!allowed.includes(key)) {
      throw new CliError(`Unexpected option --${key}`, exitCodes.usage);
    }
  }
}

export function parseExplicitRange(args) {
  const hasStart = args.start !== undefined;
  const hasEnd = args.end !== undefined;
  if (hasStart !== hasEnd) {
    throw new CliError(
      'Provide both --start and --end, or neither.',
      exitCodes.usage,
    );
  }
  if (!hasStart) return null;

  const start = parseTimestamp(args.start, 'start');
  const end = parseTimestamp(args.end, 'end');
  if (end < start) {
    throw new CliError(
      '--end must be greater than or equal to --start',
      exitCodes.usage,
    );
  }
  return { start, end };
}
