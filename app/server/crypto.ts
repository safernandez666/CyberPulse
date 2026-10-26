import crypto from 'crypto';

/* LinkedIn access tokens and the app's client secret used to sit in SQLite in
   clear text. On a laptop that is a judgement call; on a hosted disk, or in a
   backup, or in a snapshot, it is a credential leak waiting to happen.
   Everything sensitive now goes through AES-256-GCM. */

const PREFIX = 'enc.v1.';

let cachedKey: Buffer | null | undefined;

/* The key comes from CYBERPULSE_SECRET. Accepts 64 hex characters (32 bytes)
   or any passphrase, which is stretched with scrypt. */
export function getEncryptionKey(secret = process.env.CYBERPULSE_SECRET): Buffer | null {
  if (cachedKey !== undefined && secret === process.env.CYBERPULSE_SECRET) return cachedKey;

  const raw = (secret || '').trim();
  let key: Buffer | null = null;

  if (raw.length > 0) {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      key = Buffer.from(raw, 'hex');
    } else {
      /* A fixed salt keeps the derivation deterministic across restarts; the
         secret itself is what must stay secret. */
      key = crypto.scryptSync(raw, 'cyberpulse.token.v1', 32);
    }
  }

  cachedKey = key;
  return key;
}

export function isEncryptionEnabled(): boolean {
  return getEncryptionKey() !== null;
}

/* Returns the value unchanged when no secret is configured, so an existing
   local install keeps working rather than losing its LinkedIn connection. */
export function encryptSecret(plain: string): string {
  const key = getEncryptionKey();
  if (!key || plain === '') return plain;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

/* Rows written before a secret was configured are still plain text, so values
   without the marker are passed through untouched. */
export function decryptSecret(stored: string | null | undefined): string {
  if (!stored) return '';
  if (!stored.startsWith(PREFIX)) return stored;

  const key = getEncryptionKey();
  if (!key) {
    throw new Error(
      'This database holds encrypted credentials but CYBERPULSE_SECRET is not set. ' +
      'Set it to the same value used before, or disconnect and reconnect LinkedIn.'
    );
  }

  const blob = Buffer.from(stored.slice(PREFIX.length), 'base64');
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const data = blob.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/* Exposed for tests, which need a clean slate between key configurations. */
export function resetKeyCache(): void {
  cachedKey = undefined;
}
