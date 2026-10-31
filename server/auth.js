// Team accounts: sign up, log in, log out.
// Sessions live in memory, so everyone has to log in again after the server restarts.
import crypto from 'node:crypto';
import { addUser, findUser } from './db.js';

const COOKIE = 'codearena_session';
const sessions = new Map(); // token -> username

// ---- Login rate limiting --------------------------------------------------
// After MAX_FAILED_LOGINS failed logins within WINDOW_MS, either for the same
// team name or from the same IP address, login attempts get HTTP 429 with a
// Retry-After header until enough old failures have aged out of the window.
// Like sessions, the counters live in memory and reset when the server restarts.
// (Behind a reverse proxy, set app.set('trust proxy', ...) so req.ip is the real client.)
const MAX_FAILED_LOGINS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const failures = new Map(); // 'team:<name>' or 'ip:<address>' -> [{ at, team }]

const teamKey = (team) => `team:${team}`;
const ipKey = (ip) => `ip:${ip}`;

// Failures for this key that are still inside the window (old ones are forgotten).
function recentFailures(key, now) {
  const recent = (failures.get(key) || []).filter((f) => now - f.at < WINDOW_MS);
  if (recent.length) failures.set(key, recent);
  else failures.delete(key);
  return recent;
}

// Seconds until this key may try again, or 0 if it is not blocked right now.
function secondsBlocked(key, now) {
  const recent = recentFailures(key, now);
  if (recent.length < MAX_FAILED_LOGINS) return 0;
  // Allowed again once enough failures expire to get back under the limit.
  const unblockedAt = recent[recent.length - MAX_FAILED_LOGINS].at + WINDOW_MS;
  return Math.ceil((unblockedAt - now) / 1000);
}

function recordFailure(req, team) {
  const failure = { at: Date.now(), team };
  for (const key of [teamKey(team), ipKey(req.ip)]) {
    failures.set(key, [...(failures.get(key) || []), failure]);
  }
}

// A successful login wipes that team's failures. Failures from this IP against
// *other* team names are kept, so logging in to your own account can't reset the
// counter you are using to guess someone else's password.
function clearFailures(req, team) {
  failures.delete(teamKey(team));
  const rest = (failures.get(ipKey(req.ip)) || []).filter((f) => f.team !== team);
  if (rest.length) failures.set(ipKey(req.ip), rest);
  else failures.delete(ipKey(req.ip));
}

// Middleware for the login route: replies 429 + Retry-After while blocked.
// Blocked attempts are not counted, so waiting is always enough to get unblocked.
function limitLoginAttempts(req, res, next) {
  const now = Date.now();
  const team = String(req.body.username || '').trim();
  const seconds = Math.max(secondsBlocked(teamKey(team), now), secondsBlocked(ipKey(req.ip), now));
  if (seconds > 0) {
    const minutes = Math.ceil(seconds / 60);
    res.set('Retry-After', String(seconds));
    return res.status(429).json({
      error: `Too many attempts, try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
    });
  }
  next();
}

// Stop the map growing forever with guesses against team names that don't exist.
setInterval(() => {
  const now = Date.now();
  for (const key of [...failures.keys()]) recentFailures(key, now);
}, WINDOW_MS).unref();

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function startSession(res, username) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, username);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });
}

// Puts the logged-in team (if any) on req.user.
export function currentUser(req, res, next) {
  const token = readCookie(req, COOKIE);
  const username = token && sessions.get(token);
  req.user = username ? { username } : null;
  next();
}

export function requireLogin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in to submit' });
  next();
}

export function authRoutes(app) {
  app.post('/api/auth/signup', (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) {
      return res.status(400).json({ error: 'Team name and password are required' });
    }
    if (findUser(username)) {
      return res.status(409).json({ error: 'That team name is taken' });
    }
    addUser({ username, password });
    startSession(res, username);
    res.status(201).json({ username });
  });

  app.post('/api/auth/login', limitLoginAttempts, (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const user = findUser(username);
    if (!user) {
      recordFailure(req, username);
      return res.status(401).json({ error: 'No team with that name' });
    }
    if (user.password !== password) {
      recordFailure(req, username);
      return res.status(401).json({ error: 'Wrong password' });
    }
    clearFailures(req, user.username);
    startSession(res, user.username);
    res.json({ username: user.username });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie(COOKIE);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req, res) => {
    res.json(req.user);
  });
}