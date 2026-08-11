const AUTH_EMAIL = "Star007@gmail.com";
const AUTH_PASSWORD = "Star1996@";
const SESSION_KEY = "gadeer-local-auth";
const SESSION_VALUE = "authenticated";

export const LOCAL_AUTH_EMAIL = AUTH_EMAIL;
export const LOCAL_AUTH_PASSWORD = AUTH_PASSWORD;

export function signInLocally(email: string, password: string): boolean {
  const validEmail = email.trim().toLowerCase() === AUTH_EMAIL.toLowerCase();
  const validPassword = password === AUTH_PASSWORD;
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
