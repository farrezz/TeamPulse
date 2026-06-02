// AppearancePanel — coordinator-only. TODO (PRD §7.6): set the global theme,
// background colour, and background image (upload via storage.uploadImage) with
// an opacity slider. Writes config/appearance, which ThemeContext subscribes to
// and applies for everyone.

export default function AppearancePanel() {
  return (
    <section className="tp-card" style={{ marginBottom: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Utseende</h2>
      <p className="tp-muted">
        Att bygga: global tema/bakgrundsfärg samt bakgrundsbild med opacitet.
      </p>
    </section>
  );
}
