import bcrypt from "bcrypt";

/** Cost factor 10 — solid for a small app, much faster than 12 on free-tier CPUs. */
export const BCRYPT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function needsRehash(passwordHash: string) {
  try {
    return bcrypt.getRounds(passwordHash) !== BCRYPT_ROUNDS;
  } catch {
    return true;
  }
}
