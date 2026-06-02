// GroupManager — coordinator-only. TODO (PRD §7.6, §8.5): add a manual group
// (rotating:false); delete a non-rotating, empty group; reassign members
// between groups. The rotating set is frozen — never addable/deletable (an odd
// number of groups would break pairing).

export default function GroupManager() {
  return (
    <section className="tp-card" style={{ marginBottom: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Grupper</h2>
      <p className="tp-muted">
        Att bygga: lägg till manuell grupp, ta bort tom icke-roterande grupp, flytta medlemmar.
      </p>
    </section>
  );
}
