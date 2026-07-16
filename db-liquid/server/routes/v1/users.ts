import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../authMiddleware';
import { getUsers, saveUsers } from '../../mongoStore';
import { hashPlaintextPasswords } from '../../password';
import { sanitizeUser } from '../../sanitize';
import { applyAdminUsersMerge, applySelfUserPatch, UserUpdateError } from '../../userUpdates';
import { trackProductEvent } from '../../productEvents';
import type { RequestWithLog } from '../../logger';
import { isObjectStorageKey, presentUser } from './uploads';

export async function patchCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await getUsers();
    const index = users.findIndex((entry) => entry.id === req.auth!.userId);
    if (index === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const existing = users[index] as Record<string, unknown>;
    const prevCredits = Number(existing.credits ?? 0);
    const patch = { ...(req.body as Record<string, unknown>) };

    if (patch.email !== undefined) {
      const email = String(patch.email).trim().toLowerCase();
      const duplicate = users.some(
        (entry) => entry.id !== req.auth!.userId && String(entry.email).toLowerCase() === email,
      );
      if (duplicate) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }
      patch.email = email;
    }

    if (patch.profileImageUrl !== undefined && patch.profileImageUrl !== null) {
      const image = String(patch.profileImageUrl);
      if (image.startsWith('data:')) {
        res.status(400).json({
          error: 'Upload profile images via POST /api/v1/uploads, then save the storageKey.',
        });
        return;
      }
      // Ignore expired signed URLs — keep existing storage key
      if (image.startsWith('http://') || image.startsWith('https://')) {
        delete patch.profileImageUrl;
      } else if (!isObjectStorageKey(image)) {
        res.status(400).json({ error: 'Invalid profile image reference.' });
        return;
      }
    }

    const updated = applySelfUserPatch(existing, patch);
    users[index] = updated;
    await saveUsers(users);

    const nextCredits = Number((updated as { credits?: number }).credits ?? 0);
    if (nextCredits > prevCredits) {
      void trackProductEvent({
        event: 'top_up',
        userId: req.auth!.userId,
        requestId: String((req as RequestWithLog).id ?? ''),
        meta: { prevCredits, nextCredits, added: nextCredits - prevCredits },
      });
    }

    res.json({
      ok: true,
      user: await presentUser(
        updated as { id: string; profileImageUrl?: string },
        sanitizeUser(updated as Parameters<typeof sanitizeUser>[0], updated.id),
      ),
    });
  } catch (error) {
    if (error instanceof UserUpdateError) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
}

export async function putAdminUsers(req: AuthenticatedRequest, res: Response) {
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
