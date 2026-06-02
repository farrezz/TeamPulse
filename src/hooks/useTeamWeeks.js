// useTeamWeeks — live-subscribe to the teams collection and to each team's
// week-counter doc for the active week, returning per-team data plus the
// department rollup.
//
// Scale note (from the PRD): this is N reads where N = team count. Fine up to
// dozens of teams; revisit with a maintained aggregate beyond ~50. Do not
// pre-optimize now.

import { useEffect, useState } from 'react';
import { paths, subscribe } from '../firebase/storage.js';
import { makeEmptyWeek, weekTotal } from '../utils/dataUtils.js';

export function useTeamWeeks(year, weekNum) {
  const [teams, setTeams] = useState([]);
  const [weekByTeam, setWeekByTeam] = useState({}); // teamId -> { Beredningar, Beslut }

  // Subscribe to the teams collection so a newly added team appears live.
  useEffect(() => {
    const unsub = subscribe(paths.teams(), (list) => {
      const sorted = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setTeams(sorted);
    });
    return () => unsub();
  }, []);

  // Subscribe to each team's current-week doc.
  useEffect(() => {
    setWeekByTeam({});
    const unsubs = teams.map((t) =>
      subscribe(
        paths.teamWeek(t.id, year, weekNum),
        (data) =>
          setWeekByTeam((prev) => ({ ...prev, [t.id]: data ?? makeEmptyWeek() })),
        makeEmptyWeek(),
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [teams, year, weekNum]);

  const totals = teams.reduce(
    (acc, t) => {
      const w = weekByTeam[t.id] ?? makeEmptyWeek();
      acc.Beredningar += weekTotal(w, 'Beredningar');
      acc.Beslut += weekTotal(w, 'Beslut');
      return acc;
    },
    { Beredningar: 0, Beslut: 0 },
  );

  return { teams, weekByTeam, totals };
}
