// TeamTrackerPage — per-team Beredningar/Beslut counters for the active week.
// Members see every team (read) but may only +/- their own team; coordinators
// may adjust any team and type exact values. Historical weeks read back from
// their week-keyed docs via the shared week picker.

import { useWeek } from '../context/WeekContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTeamWeeks } from '../hooks/useTeamWeeks.js';
import Counter from '../components/Counter.jsx';

export default function TeamTrackerPage() {
  const { year, weekNum } = useWeek();
  const { profile, isCoordinator } = useAuth();
  const { teams, weekByTeam } = useTeamWeeks(year, weekNum);

  if (teams.length === 0) {
    return (
      <>
        <h1>Sektioner</h1>
        <p className="tp-muted">Inga sektioner än. En koordinator skapar dem under Administration.</p>
      </>
    );
  }

  return (
    <>
      <h1>Sektioner</h1>
      <div className="tp-grid-2">
        {teams.map((team) => {
          const week = weekByTeam[team.id] ?? { Beredningar: 0, Beslut: 0 };
          const canEdit = isCoordinator || profile?.teamId === team.id;
          return (
            <div className="tp-card" key={team.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>{team.name}</h2>
                {!canEdit && <span className="tp-muted" style={{ fontSize: '0.8rem' }}>Skrivskyddad</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <span>Beredningar</span>
                <Counter
                  teamId={team.id}
                  year={year}
                  weekNum={weekNum}
                  field="Beredningar"
                  value={week.Beredningar ?? 0}
                  canEdit={canEdit}
                  allowExact={isCoordinator}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span>Beslut</span>
                <Counter
                  teamId={team.id}
                  year={year}
                  weekNum={weekNum}
                  field="Beslut"
                  value={week.Beslut ?? 0}
                  canEdit={canEdit}
                  allowExact={isCoordinator}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
