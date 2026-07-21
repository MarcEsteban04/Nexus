const PBKDF2_ITERATIONS = 250_000;

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64: string): ArrayBuffer {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
}

export function generateSaltB64(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bufToBase64(salt.buffer);
}

export async function deriveKey(password: string, saltB64: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: base64ToBuf(saltB64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptText(key: CryptoKey, plaintext: string): Promise<{ ivB64: string; cipherB64: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return { ivB64: bufToBase64(iv.buffer), cipherB64: bufToBase64(cipherBuf) };
}

export async function decryptText(key: CryptoKey, ivB64: string, cipherB64: string): Promise<string> {
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuf(ivB64) },
    key,
    base64ToBuf(cipherB64),
  );
  return new TextDecoder().decode(plainBuf);
}
