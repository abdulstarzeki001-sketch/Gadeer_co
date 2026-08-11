const AUTH_EMAIL = "star007@gmail.com";
const PASSWORD_SHA256 = "15306ad1fe982392deebc586a00df219083c72b2a2c1b16889fcbdaac3f322fe";
const SESSION_KEY = "gadeer-local-auth";
const SESSION_VALUE = "authenticated";

export const LOCAL_AUTH_EMAIL = AUTH_EMAIL;

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signInLocally(email: string, password: string): Promise<boolean> {
  const validEmail = email.trim().toLowerCase() === AUTH_EMAIL;
  const validPassword = (await sha256(password)) === PASSWORD_SHA256;
  if (!validEmail || !validPassword) return false;

  localStorage.setItem(SESSION_KEY, SESSION_VALUE);
  return true;
}

export function isLocallyAuthenticated(): boolean {
  return localStorage.getItem(SESSION_KEY) === SESSION_VALUE;
}

export function signOutLocally(): void {
  localStorage.removeItem(SESSION_KEY);
}
