import fs from 'node:fs';
import path from 'node:path';
import { CliError, exitCodes } from './errors.mjs';

function parseEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    throw new CliError(`Missing .env file at ${envPath}`, exitCodes.usage);
  }

  const env = {};
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/u);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const name = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1);
    env[name] = parseEnvValue(value);
  }
  return env;
}

function requireApiKey(env) {
  const apiKey = env.WCL_API_KEY;
  if (!apiKey) {
    throw new CliError('Missing WCL_API_KEY in .env', exitCodes.usage);
  }
  return apiKey;
}

export function loadApiKey() {
  const envPath = path.resolve(process.cwd(), '.env');
  return {
    apiKey: requireApiKey(readEnv(envPath)),
    envPath,
  };
}
