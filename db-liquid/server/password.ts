import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;
const BCRYPT_HASH_PREFIX = /^\$2[aby]\$\d{2}\$/;

export function isPasswordHashed(password: string): boolean {
  return BCRYPT_HASH_PREFIX.test(password);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Verify plain text against bcrypt hash or legacy plaintext (migrate on login). */
export async function verifyPassword(plain: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  if (isPasswordHashed(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}

/** Hash any legacy plaintext passwords before persisting to MongoDB. */
export async function hashPlaintextPasswords<T extends { password?: string }>(users: T[]): Promise<T[]> {
  return Promise.all(
    users.map(async (user) => {
      if (!user.password || isPasswordHashed(user.password)) {
        return user;
      }
      return { ...user, password: await hashPassword(user.password) };
    }),
  );
}
