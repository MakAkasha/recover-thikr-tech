import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { config } from '../config';

export function validateSallaWebhook(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-salla-signature'];
  const body = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', config.sallaWebhookSecret).update(body).digest('hex');

  if (typeof signature !== 'string' || signature !== expected) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  next();
}
