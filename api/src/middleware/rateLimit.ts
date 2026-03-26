import { NextFunction, Request, Response } from 'express';

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export function rateLimitWebhook(maxRequests = 60, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || now > current.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    current.count += 1;
    buckets.set(key, current);
    next();
  };
}
