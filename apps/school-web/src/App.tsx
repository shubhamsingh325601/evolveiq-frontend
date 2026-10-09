import { Navigate, Route, Routes } from 'react-router-dom';
import { ROLE_HOME_PATH, RoleGuard, useAuth } from '@evolveiq/auth';
import { AppFrame } from './AppFrame';
import { SignInScreen } from './screens/SignInScreen';
import { StudentsScreen } from './screens/teacher/StudentsScreen';
import { StudentProfileScreen } from './screens/teacher/StudentProfileScreen';
import { StudentReportScreen } from './screens/teacher/StudentReportScreen';
import { NewObservationScreen } from './screens/teacher/NewObservationScreen';
import { AssignActivityScreen } from './screens/teacher/AssignActivityScreen';
import { ReviewQueueScreen } from './screens/psychologist/ReviewQueueScreen';
import { ObservationDetailScreen } from './screens/psychologist/ObservationDetailScreen';
import { ActivityLibraryScreen } from './screens/psychologist/ActivityLibraryScreen';
import { NewActivityScreen } from './screens/psychologist/NewActivityScreen';

/** School web app: Teacher and Psychologist. */
export function App() {
  const { user, isRestoring } = useAuth();

  return (
    <Routes>
      <Route path="/sign-in" element={<SignInScreen />} />

      <Route element={<RoleGuard allow={['teacher']} />}>
        <Route element={<AppFrame />}>
          <Route path="/teacher/students" element={<StudentsScreen />} />
          <Route path="/teacher/students/:studentId" element={<StudentProfileScreen />} />
          <Route path="/teacher/students/:studentId/report" element={<StudentReportScreen />} />
          <Route path="/teacher/observations/new" element={<NewObservationScreen />} />
          <Route path="/teacher/assign" element={<AssignActivityScreen />} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={['psychologist']} />}>
        <Route element={<AppFrame />}>
          <Route path="/review-queue" element={<ReviewQueueScreen />} />
          <Route path="/review-queue/:observationId" element={<ObservationDetailScreen />} />
          <Route path="/activities" element={<ActivityLibraryScreen />} />
          <Route path="/activities/new" element={<NewActivityScreen />} />
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
