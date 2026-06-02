// AccountsPopover — coordinator-only "Konton" control in the navbar. Creates
// additional coordinator accounts (Plan A: members share one login, so only
// coordinators get individual accounts). Uses the secondary-app helper so
// creating an account never logs the current coordinator out.
//
// The first coordinator and the shared member account are bootstrapped by hand
// in the Firebase console (see README). This handles every coordinator after.

import { useEffect, useRef, useState } from 'react';
import { IS_DEMO } from '../firebase/firebase.js';
import { createAccount } from '../firebase/accounts.js';
import { paths, subscribe, set } from '../firebase/storage.js';

export default function AccountsPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="tp-text-link" onClick={() => setOpen((o) => !o)}>
        Konton
      </button>
      {open && (
        <div className="tp-card" style={{ position: 'absolute', right: 0, top: '1.8rem', width: 280, zIndex: 20 }}>
          <p className="tp-sidebar-heading">Nytt koordinatorkonto</p>
          {IS_DEMO ? (
            <p className="tp-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Konton hanteras i skarpt läge. Koppla Firebase (lägg till .env) för att skapa konton.
            </p>
          ) : (
            <CoordinatorForm onDone={() => setOpen(false)} />
          )}
        </div>
      )}
    </div>
  );
}

function CoordinatorForm({ onDone }) {
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', teamId: '', groupId: '' });
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const u1 = subscribe(paths.teams(), (l) => setTeams([...l].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))));
    const u2 = subscribe(paths.groups(), (l) => setGroups([...l].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))));
    return () => { u1(); u2(); };
  }, []);

  function field(k) {
    return { value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) };
  }

  async function submit(e) {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      const uid = await createAccount(form.email.trim(), form.password);
      await set(paths.user(uid), {
        name: form.name.trim() || form.email.trim(),
        role: 'coordinator',
        teamId: form.teamId || teams[0]?.id || '',
        groupId: form.groupId || groups[0]?.id || '',
        active: true,
      });
      setStatus({ ok: true, msg: 'Koordinatorkonto skapat.' });
      setForm({ name: '', email: '', password: '', teamId: '', groupId: '' });
      setTimeout(onDone, 1000);
    } catch (err) {
      setStatus({ ok: false, msg: err.message || 'Kunde inte skapa kontot.' });
    } finally {
      setBusy(false);
    }
  }

  const input = { width: '100%', marginBottom: '0.5rem' };

  return (
    <form onSubmit={submit}>
      <input style={input} placeholder="Namn" {...field('name')} />
      <input style={input} type="email" placeholder="E-post" required {...field('email')} />
      <input style={input} type="password" placeholder="Lösenord (minst 6 tecken)" required minLength={6} {...field('password')} />
      <select style={input} {...field('teamId')}>
        <option value="">Sektion…</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <select style={input} {...field('groupId')}>
        <option value="">Grupp…</option>
        {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <button className="tp-btn" type="submit" disabled={busy} style={{ width: '100%' }}>
        {busy ? 'Skapar…' : 'Skapa konto'}
      </button>
      {status && (
        <p style={{ marginBottom: 0, fontSize: '0.85rem', color: status.ok ? 'var(--tp-accent)' : 'var(--tp-danger)' }}>
          {status.msg}
        </p>
      )}
    </form>
  );
}
