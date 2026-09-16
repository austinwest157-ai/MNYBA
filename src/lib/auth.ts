import { randomBytes, scryptSync, timingSafeEqual as nodeTimingSafeEqual } from "crypto";
import { prisma } from "./prisma";

const SESSION_COOKIE = "mnyba_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const APP_SETTINGS_ID = 1;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

function toBase64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(sig);
}

export async function createSessionToken(): Promise<{ token: string; expires: Date }> {
  const secret = getSecret();
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  const payload = String(expires.getTime());
  const sig = await hmac(payload, secret);
  return { token: `${payload}.${sig}`, expires };
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  try {
    const expectedSig = await hmac(payload, getSecret());
    return timingSafeEqualStr(sig, expectedSig);
  } catch {
    return false;
  }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// scrypt hash stored as "salt:hash", both hex.
export function hashPasscode(passcode: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(passcode, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPasscodeHash(passcode: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(passcode, salt, expected.length);
  return expected.length === actual.length && nodeTimingSafeEqual(expected, actual);
}

/**
 * The app has no login at all until a passcode is set from Settings. Once
 * one exists in the database, that's the sole source of truth — there is no
 * environment-variable fallback, so there's nothing to get out of sync with
 * a hosting dashboard.
 */
export async function isLoginRequired(): Promise<boolean> {
  const settings = await prisma.appSettings.findUnique({ where: { id: APP_SETTINGS_ID } });
  return Boolean(settings?.passcodeHash);
}

export async function verifyPasscode(candidate: string): Promise<boolean> {
  const settings = await prisma.appSettings.findUnique({ where: { id: APP_SETTINGS_ID } });
  if (!settings?.passcodeHash) return false;
  return verifyPasscodeHash(candidate.trim(), settings.passcodeHash);
}

export async function setPasscode(newPasscode: string): Promise<void> {
  const passcodeHash = hashPasscode(newPasscode.trim());
  await prisma.appSettings.upsert({
    where: { id: APP_SETTINGS_ID },
    update: { passcodeHash },
    create: { id: APP_SETTINGS_ID, passcodeHash },
  });
}

export async function clearPasscode(): Promise<void> {
  await prisma.appSettings.upsert({
    where: { id: APP_SETTINGS_ID },
    update: { passcodeHash: null },
    create: { id: APP_SETTINGS_ID, passcodeHash: null },
  });
}

export { SESSION_COOKIE };
