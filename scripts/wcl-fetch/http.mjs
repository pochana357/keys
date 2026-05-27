import { ApiError } from './errors.mjs';

export function redactUrl(url) {
  const redacted = new URL(url);
  const query = [...redacted.searchParams.entries()]
    .map(([key, value]) =>
      key === 'api_key'
        ? `${encodeURIComponent(key)}=<redacted>`
        : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join('&');
  return `${redacted.origin}${redacted.pathname}${query ? `?${query}` : ''}${redacted.hash}`;
}

export function buildUrl(base, params) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export function writeDiagnostic(logger, message) {
  if (logger) logger(message);
}

export async function requestJson(url, label, logger = console.error) {
  writeDiagnostic(logger, `[request] ${label}: ${redactUrl(url)}`);

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new ApiError(
      `${label} request failed: ${error.message}`,
      { label, url },
      null,
    );
  }

  const body = await response.text();
  writeDiagnostic(logger, `[response] ${label}: HTTP ${response.status}`);

  if (!response.ok) {
    throw new ApiError(
      `${label} returned HTTP ${response.status}`,
      { label, url },
      {
        status: response.status,
        body,
      },
    );
  }

  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new ApiError(
      `${label} returned invalid JSON: ${error.message}`,
      { label, url },
      {
        status: response.status,
        body,
      },
    );
  }
}
