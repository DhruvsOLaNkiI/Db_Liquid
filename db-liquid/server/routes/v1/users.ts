import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../authMiddleware';
import { getUsers, saveUsers } from '../mongoStore';
import { hashPlaintextPasswords } from '../password';
import { sanitizeUser } from '../sanitize';
import { applyAdminUsersMerge, applySelfUserPatch, UserUpdateError } from '../userUpdates';

export async function patchCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({ error: 'Expected a JSON object with fields to update.' });
    return;
  }

  try {
    const users = await getUsers();
    const index = users.findIndex((entry) => entry.id === req.auth!.userId);
    if (index === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const existing = users[index] as Record<string, unknown>;
    const patch = req.body as Record<string, unknown>;

    if (patch.email !== undefined) {
      const email = String(patch.email).trim().toLowerCase();
      if (!email.includes('@')) {
        res.status(400).json({ error: 'Enter a valid email address.' });
        return;
      }
      const duplicate = users.some(
        (entry) => entry.id !== req.auth!.userId && String(entry.email).toLowerCase() === email,
      );
      if (duplicate) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }
      patch.email = email;
    }

    const updated = applySelfUserPatch(existing, patch);
    users[index] = updated;
    await saveUsers(users);

    res.json({ ok: true, user: sanitizeUser(updated as Parameters<typeof sanitizeUser>[0], updated.id) });
  } catch (error) {
    if (error instanceof UserUpdateError) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
}

export async function putAdminUsers(req: AuthenticatedRequest, res: Response) {
  if (!Array.isArray(req.body)) {
    res.status(400).json({ error: 'Expected an array of users.' });
    return;
  }

  try {
    const existing = await getUsers();
    const merged = applyAdminUsersMerge(
      existing as Record<string, unknown>[],
      req.body as Record<string, unknown>[],
    );
    const hashed = await hashPlaintextPasswords(merged);
    await saveUsers(hashed);
    res.json({ ok: true, count: hashed.length });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
}

export function deprecatedBulkUsersPut(_req: Request, res: Response) {
  res.status(403).json({
    error: 'Bulk user writes are not allowed on this endpoint.',
    deprecated: true,
    use: {
      self: 'PATCH /api/v1/users/me',
      admin: 'PUT /api/v1/admin/users',
    },
  });
}
