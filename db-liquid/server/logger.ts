import { randomUUID } from 'node:crypto';
import pino from 'pino';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';

const isProd = process.env.NODE_ENV === 'production';

/** MON-002 — shared structured logger (Pino). */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  base: { service: 'db-liquid-api' },
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }),
});

export type RequestWithLog = Request & {
  id?: string;
  log?: pino.Logger;
};

/** Attach request ID + HTTP access logs. */
export function requestLoggingMiddleware() {
  return pinoHttp({
    logger,
    genReqId(req: IncomingMessage, _res: ServerResponse) {
      const existing = req.headers['x-request-id'];
      if (typeof existing === 'string' && existing.trim()) return existing.trim();
      return randomUUID();
    },
    customProps(req) {
      return { requestId: req.id };
    },
    customLogLevel(_req, res, err) {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    autoLogging: {
      ignore(req) {
        const url = req.url || '';
        return url.startsWith('/api/health') || url === '/health';
      },
    },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
        };
      },
    },
  });
}

/** Echo request id to clients for support (MON-002). Run after pino-http. */
export function exposeRequestId(req: Request, res: Response, next: NextFunction) {
  const id = (req as RequestWithLog).id || randomUUID();
  (req as RequestWithLog).id = id;
  if (!res.getHeader('X-Request-Id')) {
    res.setHeader('X-Request-Id', String(id));
  }
  next();
}
