// TeamTrackerPage — per-team, per-day case tracking for the active week.
// The team is chosen from the left sidebar (the sole jump-between navigation);
// this page just renders the selected team's Beredningar and Beslut as Mån–Fre
// day grids. Members may only +/- their own team; coordinators may adjust any
// team and type exact values. Historical weeks read back from their week-keyed
// docs via the shared week picker.

import { useParams } from 'react-router-dom';
import { useWeek } from '../context/WeekContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTeamWeeks } from '../hooks/useTeamWeeks.js';
import { makeEmptyWeek } from '../utils/dataUtils.js';
import CategoryTable from '../components/CategoryTable.jsx';

export default function TeamTrackerPage() {
  const { year, weekNum } = useWeek();
  const { profile, isCoordinator } = useAuth();
  const { teams, weekByTeam } = useTeamWeeks(year, weekNum);
  const { teamId } = useParams();

  if (teams.length === 0) {
    return (
      <>
        <h1>Sektioner</h1>
        <p className="tp-muted">Inga sektioner än. En koordinator skapar dem under Administration.</p>
      </>
    );
  }

  // Default selection: route param → own team → first team.
  const selectedId =
    (teamId && teams.some((t) => t.id === teamId) && teamId) ||
    (teams.some((t) => t.id === profile?.teamId) && profile?.teamId) ||
    teams[0].id;
  const selected = teams.find((t) => t.id === selectedId);
  const week = weekByTeam[selectedId] ?? makeEmptyWeek();
  const canEdit = isCoordinator || profile?.teamId === selectedId;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: '0 0 0.5rem' }}>{selected.name}</h1>
        {!canEdit && <span className="tp-muted" style={{ fontSize: '0.8rem' }}>Skrivskyddad</span>}
      </div>

      <div className="tp-grid-2">
        <CategoryTable
          title="Beredningar"
          teamId={selectedId}
          year={year}
          weekNum={weekNum}
          field="Beredningar"
          week={week}
          canEdit={canEdit}
          allowExact={isCoordinator}
        />
        <CategoryTable
          title="Beslut"
          teamId={selectedId}
          year={year}
          weekNum={weekNum}
          field="Beslut"
          week={week}
          canEdit={canEdit}
          allowExact={isCoordinator}
        />
      </div>
    </>
  );
}
