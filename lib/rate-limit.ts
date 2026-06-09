import { headers } from "next/headers";

// In-memory sliding window rate limiter.
// Effective against rapid automated requests from a single IP within one
// serverless instance. Counters reset on cold-start — intentionally simple
// and proportionate for low-traffic, unauthenticated helper endpoints.

const windows = new Map<string, number[]>();

// Prune stale entries every ~200 insertions to prevent unbounded growth.
let insertCount = 0;
function maybePrune(windowMs: number) {
  if (++insertCount < 200) return;
  insertCount = 0;
  const cutoff = Date.now() - windowMs;
  for (const [key, timestamps] of windows) {
    const fresh = timestamps.filter((t) => t > cutoff);
    if (fresh.length === 0) windows.delete(key);
    else windows.set(key, fresh);
  }
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

/** Core sliding-window check — shared by both public functions. */
function slidingWindow(
  key: string,
  ip: string,
  opts: { max: number; windowMs: number }
): boolean {
  const bucket = `${key}:${ip}`;
  const now = Date.now();
  const cutoff = now - opts.windowMs;

  const timestamps = (windows.get(bucket) ?? []).filter((t) => t > cutoff);
  if (timestamps.length >= opts.max) return true;

  timestamps.push(now);
  windows.set(bucket, timestamps);
  maybePrune(opts.windowMs);
  return false;
}

/**
 * For Server Actions — reads the client IP from next/headers automatically.
 * Returns true if the caller should be blocked.
 */
export async function isRateLimited(
  key: string,
  opts: { max: number; windowMs: number }
): Promise<boolean> {
  const ip = await getClientIp();
  return slidingWindow(key, ip, opts);
}

/**
 * For Route Handlers — pass the raw Request so the IP is extracted without
 * requiring next/headers (unavailable in that context).
 * Returns true if the caller should be blocked.
 */
export function checkRateLimit(
  req: Request,
  key: string,
  opts: { max: number; windowMs: number }
): boolean {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return slidingWindow(key, ip, opts);
}
