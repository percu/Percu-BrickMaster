const BASE = 'https://rebrickable.com/api/v3/lego';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function rb(path) {
  const key = process.env.REBRICKABLE_API_KEY;
  if (!key) throw new Error('REBRICKABLE_API_KEY is missing. Copy .env.example to .env and add your key.');
  const response = await fetch(`${BASE}${path}`, { headers: { Authorization: `key ${key}` } });
  if (response.status === 429) {
    const retry = Number(response.headers.get('Retry-After') || 2);
    await delay(retry * 1000);
    return rb(path);
  }
  if (!response.ok) throw new Error(`Rebrickable returned ${response.status} for ${path}`);
  const data = await response.json();
  // Rebrickable exposes remaining/reset headers; pause before the next page when exhausted.
  const remaining = Number(response.headers.get('X-RateLimit-Remaining'));
  if (remaining === 0) {
    const reset = Number(response.headers.get('X-RateLimit-Reset') || 1);
    await delay(Math.max(1, reset) * 1000);
  }
  return { data, headers: response.headers };
}
