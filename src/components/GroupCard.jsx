// GroupCard — one group, its members (mixed across teams), and its task for the
// active week. Task is computed for rotating groups, read from manualTasks for
// manual groups ("—" when unset).

export default function GroupCard({ group, members, task }) {
  return (
    <div className="tp-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ margin: 0 }}>{group.name}</h2>
        {!group.rotating && <span className="tp-muted" style={{ fontSize: '0.8rem' }}>Manuell</span>}
      </div>

      <p style={{ margin: '0.5rem 0', fontWeight: 600, color: 'var(--tp-primary)' }}>
        {task}
      </p>

      {members.length === 0 ? (
        <p className="tp-muted" style={{ margin: 0 }}>Inga medlemmar.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {members.map((m) => (
            <li key={m.id}>{m.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
