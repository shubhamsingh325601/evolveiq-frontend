import { Navigate, Route, Routes } from 'react-router-dom';
import { ROLE_APP, ROLE_HOME_PATH, RoleGuard, useAuth } from '@evolveiq/auth';
import { AppFrame } from './AppFrame';
import { SignInScreen } from './screens/SignInScreen';
import { StudentsScreen } from './screens/teacher/StudentsScreen';
import { StudentProfileScreen } from './screens/teacher/StudentProfileScreen';
import { NewObservationScreen } from './screens/teacher/NewObservationScreen';
import { AssignActivityScreen } from './screens/teacher/AssignActivityScreen';
import { AttendanceScreen } from './screens/teacher/AttendanceScreen';
import { ReviewsScreen } from './screens/teacher/ReviewsScreen';
import { NoticesScreen } from './screens/NoticesScreen';
import { ReviewQueueScreen } from './screens/psychologist/ReviewQueueScreen';
import { ObservationDetailScreen } from './screens/psychologist/ObservationDetailScreen';
import { ActivityLibraryScreen } from './screens/psychologist/ActivityLibraryScreen';
import { ActivityEditorScreen } from './screens/psychologist/ActivityEditorScreen';

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
          <Route path="/teacher/observations/new" element={<NewObservationScreen />} />
          <Route path="/teacher/assign" element={<AssignActivityScreen />} />
          <Route path="/teacher/attendance" element={<AttendanceScreen />} />
          <Route path="/teacher/reviews" element={<ReviewsScreen />} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={['teacher', 'psychologist']} />}>
        <Route element={<AppFrame />}>
          <Route path="/notices" element={<NoticesScreen />} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={['psychologist']} />}>
        <Route element={<AppFrame />}>
          <Route path="/review-queue" element={<ReviewQueueScreen />} />
          <Route path="/review-queue/:observationId" element={<ObservationDetailScreen />} />
          <Route path="/activities" element={<ActivityLibraryScreen />} />
          <Route path="/activities/new" element={<ActivityEditorScreen />} />
          <Route path="/activities/:activityId/edit" element={<ActivityEditorScreen />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          isRestoring ? null : (
            // Someone signed in for another app has no home here: back to sign-in, not a redirect loop.
            <Navigate to={user && ROLE_APP[user.role] === 'school' ? ROLE_HOME_PATH[user.role] : '/sign-in'} replace />
          )
        }
      />
    </Routes>
  );
}
