import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

// index.html reads the same key, so keep the two in step.
const THEME_KEY = 'codearena-theme';

// Browsers can refuse storage (private mode, blocked cookies), so never let it break the page.
function wasDarkLastTime() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark';
  } catch {
    return false;
  }
}

export default function Navbar() {
  const [dark, setDark] = useState(wasDarkLastTime);
  const { user, checking, logout } = useAuth();

  // The dark colours live on <html>, so they reach the whole page and not just this navbar.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    } catch {
      // Not remembered this time; the toggle still works for this visit.
    }
  }, [dark]);

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Code<span>Arena</span>
      </Link>
      <NavLink to="/">Problems</NavLink>
      <NavLink to="/leaderboard">Leaderboard</NavLink>
      <div className="spacer" />
      {checking ? null : user ? (
        <>
          <span className="team-name">👥 {user.username}</span>
          <button className="ghost" onClick={logout}>
            Log out
          </button>
        </>
      ) : (
        <>
          <NavLink to="/login">Log in</NavLink>
          <Link to="/signup" className="button">
            Sign up
          </Link>
        </>
      )}
      <button className="ghost" onClick={() => setDark(!dark)} title="Toggle dark mode">
        {dark ? '☀️' : '🌙'}
      </button>
    </nav>
  );
}