import process from 'node:process';
import { main } from './wcl-fetch/commands.mjs';
import { printError } from './wcl-fetch/errors.mjs';
import { redactUrl } from './wcl-fetch/http.mjs';

try {
  await main(process.argv.slice(2));
} catch (error) {
  printError(error, { redactUrl });
}
