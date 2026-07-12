import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

/** Validate req.body with a Zod schema; replace body with parsed/coerced value. */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      const path = first?.path?.length ? first.path.join('.') : 'body';
      const message = first?.message ?? 'Invalid request body.';
      res.status(400).json({
        error: `${path}: ${message}`,
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.') || 'body',
          message: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
