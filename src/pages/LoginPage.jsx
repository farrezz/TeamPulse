// LoginPage — email/password sign-in. No self-registration: accounts are
// created by coordinators (see README bootstrap).

import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError('Inloggningen misslyckades. Kontrollera e-post och lösenord.');
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
      }}
    >
      <form className="tp-card" onSubmit={handleSubmit} style={{ width: 'min(360px, 100%)' }}>
        <h1 style={{ marginTop: 0 }}>TeamPulse</h1>
        <p className="tp-muted">Logga in för att se avdelningens översikt.</p>

        <label style={{ display: 'block', marginBottom: '0.75rem' }}>
          E-post
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Lösenord
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>

        {error && (
          <p style={{ color: 'var(--tp-danger)', marginTop: 0 }}>{error}</p>
        )}

        <button className="tp-btn" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Loggar in…' : 'Logga in'}
        </button>
      </form>
    </div>
  );
}
