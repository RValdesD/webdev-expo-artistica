import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export class PasswordBusyError extends Error {}
let activeHashes = 0;

// scrypt uses memory and CPU to make stolen password hashes expensive to guess.
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (activeHashes >= 2) { reject(new PasswordBusyError()); return; }
    activeHashes += 1;
    try {
      scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }, (error, key) => {
        activeHashes -= 1;
        if (error) reject(error);
        else resolve(key);
      });
    } catch (error: unknown) {
      activeHashes -= 1;
      reject(error);
    }
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `scrypt-v1:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [version, salt, hex] = stored.split(':');
  if (version !== 'scrypt-v1' || !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{128}$/.test(hex ?? '')) return false;
  const key = await derive(password, salt);
  return timingSafeEqual(key, Buffer.from(hex, 'hex'));
}

// Used when an email is unknown, so login still performs password hashing work.
export const dummyPasswordHash = `scrypt-v1:${'0'.repeat(32)}:${'0'.repeat(128)}`;
