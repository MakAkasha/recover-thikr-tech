import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { config } from '../config';

export function validateSallaWebhook(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-salla-signature'];
  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).json({ error: 'Invalid webhook body' });
    return;
  }

  const expected = crypto.createHmac('sha256', config.sallaWebhookSecret).update(rawBody).digest('hex');

  if (typeof signature !== 'string') {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const received = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (received.length !== expectedBuffer.length || !crypto.timingSafeEqual(received, expectedBuffer)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  next();
}
