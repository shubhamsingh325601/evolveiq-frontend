import { Navigate, Route, Routes } from 'react-router-dom';
import { RoleGuard, ROLE_HOME_PATH, useAuth } from '@evolveiq/auth';
import { AppFrame } from './AppFrame';
import { SignInScreen } from './screens/SignInScreen';
import { TodayScreen } from './screens/student/TodayScreen';
import { ActivityScreen } from './screens/student/ActivityScreen';
import { ProgressScreen } from './screens/student/ProgressScreen';
import { ChildrenScreen } from './screens/parent/ChildrenScreen';
import { ChildDetailScreen } from './screens/parent/ChildDetailScreen';
import { TeacherNotesScreen } from './screens/parent/TeacherNotesScreen';
import { MonthlySummaryScreen } from './screens/parent/MonthlySummaryScreen';
import { ObservationsScreen } from './screens/parent/ObservationsScreen';
import { NewObservationScreen } from './screens/parent/NewObservationScreen';

/** Family web app: Student and Parent. Roles are guarded, never screen-checked. */
export function App() {
  const { user, isRestoring } = useAuth();

  return (
    <Routes>
      <Route path="/sign-in" element={<SignInScreen />} />

      <Route element={<RoleGuard allow={['student']} />}>
        <Route element={<AppFrame />}>
          <Route path="/student/today" element={<TodayScreen />} />
          <Route path="/student/activities/:assignmentId" element={<ActivityScreen />} />
          <Route path="/student/progress" element={<ProgressScreen />} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={['parent']} />}>
        <Route element={<AppFrame />}>
          <Route path="/parent/children" element={<ChildrenScreen />} />
          <Route path="/parent/children/:childId" element={<ChildDetailScreen />} />
          <Route path="/parent/children/:childId/notes" element={<TeacherNotesScreen />} />
          <Route path="/parent/children/:childId/summary" element={<MonthlySummaryScreen />} />
          <Route path="/parent/observations" element={<ObservationsScreen />} />
          <Route path="/parent/observations/new" element={<NewObservationScreen />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          isRestoring ? null : (
            <Navigate to={user ? ROLE_HOME_PATH[user.role] : '/sign-in'} replace />
          )
        }
      />
    </Routes>
  );
}
