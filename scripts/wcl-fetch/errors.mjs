export const exitCodes = {
  usage: 1,
  api: 2,
  selection: 3,
};

export class CliError extends Error {
  constructor(message, exitCode) {
    super(message);
    this.exitCode = exitCode;
  }
}

export class ApiError extends CliError {
  constructor(message, request, response) {
    super(message, exitCodes.api);
    this.request = request;
    this.response = response;
  }
}

export function printError(error, { redactUrl }) {
  const exitCode = error instanceof CliError ? error.exitCode : 1;

  console.error('');
  console.error(`[error] ${error.message}`);

  if (error instanceof ApiError) {
    if (error.request) {
      console.error(
        `[request] ${error.request.label}: ${redactUrl(error.request.url)}`,
      );
    }
    if (error.response) {
      console.error(`[response] HTTP ${error.response.status}`);
      if (error.response.body) {
        console.error('[body]');
        console.error(error.response.body);
      }
    }
  }

  process.exitCode = exitCode;
}
