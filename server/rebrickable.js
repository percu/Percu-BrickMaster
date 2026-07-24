const BASE = 'https://rebrickable.com/api/v3/lego';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const statusDescriptions = {
  400: 'Something was wrong with the format of the request. Check the set number and try again.',
  401: 'Unauthorized: the Rebrickable API key is invalid. Check REBRICKABLE_API_KEY in your .env file.',
  403: 'Forbidden: this API key does not have access to the requested item.',
  404: 'Item not found. Check that the set number exists in Rebrickable.',
  429: 'Request was throttled because too many requests were sent too quickly. Please wait before trying again.'
};

async function rebrickableError(response) {
  const body = await response.json().catch(() => ({}));
  const description = statusDescriptions[response.status] || 'Rebrickable could not complete this request.';
  const detail = body.detail || body.error || '';
  return `Rebrickable error ${response.status}: ${description}${detail ? ` (${detail})` : ''}`;
}

export async function rb(path, retryAttempt = 0) {
  const key = process.env.REBRICKABLE_API_KEY;
  if (!key) throw new Error('REBRICKABLE_API_KEY is missing. Copy .env.example to .env and add your key.');
  const response = await fetch(`${BASE}${path}`, { headers: { Authorization: `key ${key}` } });
  if (response.status === 429) {
    const retry = Number(response.headers.get('Retry-After') || 2);
    if (retryAttempt < 1) {
      await delay(retry * 1000);
      return rb(path, retryAttempt + 1);
    }
    throw new Error(await rebrickableError(response));
  }
  if (!response.ok) throw new Error(await rebrickableError(response));
  const data = await response.json();
  // Rebrickable exposes remaining/reset headers; pause before the next page when exhausted.
  const remaining = Number(response.headers.get('X-RateLimit-Remaining'));
  if (remaining === 0) {
    const reset = Number(response.headers.get('X-RateLimit-Reset') || 1);
    await delay(Math.max(1, reset) * 1000);
  }
  return { data, headers: response.headers };
}
