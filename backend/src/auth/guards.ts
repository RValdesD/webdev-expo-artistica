import type { Request, Response, NextFunction } from 'express';

// Browser writes must originate from our configured frontend and use our header.
// No permissive CORS is configured. JSON/custom headers require a cross-origin preflight.
export function trustedWrite(req: Request, res: Response, next: NextFunction): void {
  const allowed = (process.env.APP_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(value => value.trim()).filter(Boolean);
  const origin = req.get('Origin');
  if (!origin || !allowed.includes(origin) || req.get('X-Expo-Request') !== '1') {
    res.status(403).json({ error: 'Origen de solicitud no permitido. Revisa APP_ORIGINS.' });
    return;
  }
  next();
}

// Single-process coursework limiter. A shared limiter is needed for multiple servers.
const attempts = new Map<string, { count: number; until: number }>();
export function authRateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const ip = req.ip ?? 'unknown';
  const current = attempts.get(ip) ?? { count: 0, until: now + 15 * 60 * 1000 };
  if (current.count >= 20 || (!attempts.has(ip) && attempts.size >= 10000)) {
    res.setHeader('Retry-After', Math.ceil((current.until - now) / 1000));
    res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
    return;
  }
  current.count += 1;
  attempts.set(ip, current);
  next();
}
