// UserManager — coordinator-only. TODO (PRD §7.6): create/edit/remove a user;
// set name, teamId, groupId, role (incl. promoting a member to coordinator);
// soft-disable via `active`. Creating an Auth user from the client requires a
// secondary Auth app instance (or a Cloud Function) so the coordinator's own
// session isn't replaced — decide the approach before implementing.

export default function UserManager() {
  return (
    <section className="tp-card" style={{ marginBottom: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Användare</h2>
      <p className="tp-muted">
        Att bygga: skapa/redigera/ta bort användare, sätt namn, sektion, grupp och roll.
      </p>
    </section>
  );
}
