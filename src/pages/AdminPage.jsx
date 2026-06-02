// AdminPage — coordinator-only hub. Route is guarded in App.jsx; the matching
// Firestore rules are the real enforcement. The weekly goal editor lives inline
// on the Dashboard, so it's not duplicated here.

import TeamManager from '../components/admin/TeamManager.jsx';
import UserManager from '../components/admin/UserManager.jsx';
import GroupManager from '../components/admin/GroupManager.jsx';
import RotationEditor from '../components/admin/RotationEditor.jsx';
import AppearancePanel from '../components/admin/AppearancePanel.jsx';

export default function AdminPage() {
  return (
    <>
      <h1>Administration</h1>
      <TeamManager />
      <UserManager />
      <GroupManager />
      <RotationEditor />
      <AppearancePanel />
    </>
  );
}
