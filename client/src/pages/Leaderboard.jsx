import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Leaderboard() {
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .leaderboard()
      .then(setBoard)
      .catch(() => setError('Could not load the leaderboard. Please try again.'));
  }, []);

  return (
    <section>
      <h1>Leaderboard</h1>
      {error ? (
        <p className="error">{error}</p>
      ) : !board ? (
        <p className="muted">Loading...</p>
      ) : board.length === 0 ? (
        <p className="muted">No team has solved a problem yet. Be the first!</p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Solved</th>
              </tr>
            </thead>
            <tbody>
              {board.map((row, i) => (
                <tr key={row.username} className={row.username === user?.username ? 'me' : ''}>
                  <td>{i + 1}</td>
                  <td>
                    {row.username}
                    {row.username === user?.username && ' (you)'}
                  </td>
                  <td>{row.solved}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Teams with the same score are ranked by who reached it first.</p>
        </>
      )}
    </section>
  );
}