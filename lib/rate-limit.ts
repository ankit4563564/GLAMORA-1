const ipMap = new Map<string, number>();

export function rateLimit(
  ip: string,
  windowMs = 30_000
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const last = ipMap.get(ip);
  if (last && now - last < windowMs) {
    return { allowed: false, retryAfter: Math.ceil((windowMs - (now - last)) / 1000) };
  }
  ipMap.set(ip, now);
  if (ipMap.size > 10_000) {
    const cutoff = now - windowMs * 2;
    for (const [key, ts] of ipMap) {
      if (ts < cutoff) ipMap.delete(key);
    }
  }
  return { allowed: true };
}
