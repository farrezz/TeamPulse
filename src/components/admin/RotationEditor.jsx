// RotationEditor — coordinator-only. TODO (PRD §7.4, §8): edit the three slot
// labels, set a per-week override for a rotating pair (override does NOT shift
// the ongoing cycle), and set a manual group's weekly task. Read/write
// config/rotation; overrides keyed by weekKey, manualTasks keyed by
// weekKey -> groupId.

export default function RotationEditor() {
  return (
    <section className="tp-card" style={{ marginBottom: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Rotation</h2>
      <p className="tp-muted">
        Att bygga: redigera slot-etiketter, veckoundantag för par, samt manuell grupps veckouppgift.
      </p>
    </section>
  );
}
