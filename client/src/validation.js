// Sign-up rules, checked in the browser before anything is sent.
// Keep these numbers in sync with server/auth.js, which checks them again
// because a browser can always be bypassed.
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_TEAM_NAME_LENGTH = 3;
export const MAX_TEAM_NAME_LENGTH = 30;

// Returns an error message for the sign-up form, or '' if everything is fine.
export function signupError(username, password, confirm) {
  const name = username.trim();
  if (name.length < MIN_TEAM_NAME_LENGTH || name.length > MAX_TEAM_NAME_LENGTH) {
    return `Team name must be ${MIN_TEAM_NAME_LENGTH} to ${MAX_TEAM_NAME_LENGTH} characters`;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password !== confirm) return 'Passwords do not match';
  return '';
}