import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptSecret, decryptSecret, isEncryptionEnabled, resetKeyCache } from './crypto';

const ORIGINAL = process.env.CYBERPULSE_SECRET;

function withSecret(secret: string | undefined) {
  if (secret === undefined) delete process.env.CYBERPULSE_SECRET;
  else process.env.CYBERPULSE_SECRET = secret;
  resetKeyCache();
}

beforeEach(() => resetKeyCache());
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CYBERPULSE_SECRET;
  else process.env.CYBERPULSE_SECRET = ORIGINAL;
  resetKeyCache();
});

describe('with no secret configured', () => {
  beforeEach(() => withSecret(undefined));

  it('reports encryption as off', () => {
    expect(isEncryptionEnabled()).toBe(false);
  });

  it('passes values through so an existing local install keeps working', () => {
    expect(encryptSecret('token-abc')).toBe('token-abc');
    expect(decryptSecret('token-abc')).toBe('token-abc');
  });
});

describe('with a passphrase secret', () => {
  beforeEach(() => withSecret('a long enough passphrase for scrypt'));

  it('reports encryption as on', () => {
    expect(isEncryptionEnabled()).toBe(true);
  });

  it('round-trips a token', () => {
    const token = 'AQX-linkedin-access-token-value';
    const stored = encryptSecret(token);
    expect(stored).not.toContain(token);
    expect(stored.startsWith('enc.v1.')).toBe(true);
    expect(decryptSecret(stored)).toBe(token);
  });

  it('produces a different ciphertext each time, so values are not comparable', () => {
    expect(encryptSecret('same')).not.toBe(encryptSecret('same'));
  });

  it('still reads rows written before a secret existed', () => {
    expect(decryptSecret('legacy-plaintext-token')).toBe('legacy-plaintext-token');
  });

  it('round-trips unicode and long values', () => {
    const odd = 'ñ✓🔐 ' + 'x'.repeat(4000);
    expect(decryptSecret(encryptSecret(odd))).toBe(odd);
  });

  it('leaves empty strings alone', () => {
    expect(encryptSecret('')).toBe('');
    expect(decryptSecret('')).toBe('');
    expect(decryptSecret(null)).toBe('');
    expect(decryptSecret(undefined)).toBe('');
  });

  it('rejects a tampered ciphertext rather than returning garbage', () => {
    const stored = encryptSecret('sensitive');
    const body = stored.slice('enc.v1.'.length);
    const buf = Buffer.from(body, 'base64');
    buf[buf.length - 1] ^= 0xff; // flip a bit in the payload
    const tampered = 'enc.v1.' + buf.toString('base64');
    expect(() => decryptSecret(tampered)).toThrow();
  });
});

describe('with a 64-char hex secret', () => {
  const hex = 'a'.repeat(64);
  beforeEach(() => withSecret(hex));

  it('uses it directly as the key and round-trips', () => {
    expect(decryptSecret(encryptSecret('hello'))).toBe('hello');
  });
});

describe('key changes', () => {
  it('cannot read a value encrypted under a different secret', () => {
    withSecret('first secret value here');
    const stored = encryptSecret('token');

    withSecret('a completely different secret');
    expect(() => decryptSecret(stored)).toThrow();
  });

  it('explains itself when the secret has gone missing', () => {
    withSecret('some secret value');
    const stored = encryptSecret('token');

    withSecret(undefined);
    expect(() => decryptSecret(stored)).toThrow(/CYBERPULSE_SECRET/);
  });
});
