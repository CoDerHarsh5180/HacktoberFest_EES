import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { signupError } from '../validation.js';

// One page for both "Log in" and "Sign up"; mode decides which.
export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    // Only sign up has rules: old accounts with short passwords must still be able to log in.
    const problem = isSignup ? signupError(username, password, confirm) : '';
    if (problem) return setError(problem);
    setError('');
    setBusy(true);
    try {
      if (isSignup) await signup(username, password);
      else await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <h1>{isSignup ? 'Create a team account' : 'Log in'}</h1>
      <p className="muted">You only need an account to submit code. Browsing problems is open to everyone.</p>
      {isSignup && <p className="muted">Team name: 3 to 30 characters. Password: at least 8 characters.</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Team name
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </label>
        {isSignup && (
          <label>
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait...' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>
      <p className="muted">
        {isSignup ? (
          <>
            Already have an account? <Link to="/login">Log in</Link>
          </>
        ) : (
          <>
            New here? <Link to="/signup">Create a team account</Link>
          </>
        )}
      </p>
    </section>
  );
}