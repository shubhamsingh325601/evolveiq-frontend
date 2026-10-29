import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { RoleGuard, ROLE_APP, ROLE_HOME_PATH, useAuth } from '@evolveiq/auth';
import { AppFrame } from './AppFrame';
import { SignInScreen } from './screens/SignInScreen';
import { TodayScreen } from './screens/student/TodayScreen';
import { ActivityScreen } from './screens/student/ActivityScreen';
import { ProgressScreen } from './screens/student/ProgressScreen';
import { ReportScreen as StudentReportScreen } from './screens/student/ReportScreen';
import { WellbeingScreen as StudentWellbeingScreen } from './screens/student/WellbeingScreen';
import { ExploreScreen as StudentExploreScreen } from './screens/student/ExploreScreen';
import { AskScreen as StudentAskScreen } from './screens/student/AskScreen';
import { ChildrenScreen } from './screens/parent/ChildrenScreen';
import { ChildDashboardScreen } from './screens/parent/ChildDashboardScreen';
import { MonthlySummaryScreen } from './screens/parent/MonthlySummaryScreen';
import { ReportScreen as ParentReportScreen } from './screens/parent/ReportScreen';
import { ExploreScreen as ParentExploreScreen } from './screens/parent/ExploreScreen';
import { ExploreLandingScreen } from './screens/parent/ExploreLandingScreen';
import { AskScreen as ParentAskScreen } from './screens/parent/AskScreen';
import { SiblingsScreen } from './screens/parent/SiblingsScreen';
import { PrivacyScreen } from './screens/parent/PrivacyScreen';
import { ObservationsScreen } from './screens/parent/ObservationsScreen';
import { NewObservationScreen } from './screens/parent/NewObservationScreen';
import { HealthLandingScreen, HealthScreen } from './screens/parent/HealthScreen';
import { NoticesScreen } from './screens/NoticesScreen';

/** The old wellbeing address of a child: their health page now holds the check-in. */
function WellbeingRedirect() {
  const { childId } = useParams<{ childId: string }>();
  return <Navigate to={childId ? `/parent/health/${childId}` : '/parent/health'} replace />;
}

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
          <Route path="/student/report" element={<StudentReportScreen />} />
          <Route path="/student/wellbeing" element={<StudentWellbeingScreen />} />
          <Route path="/student/explore" element={<StudentExploreScreen />} />
          <Route path="/student/ask" element={<StudentAskScreen />} />
          <Route path="/student/notices" element={<NoticesScreen />} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={['parent']} />}>
        <Route element={<AppFrame />}>
          <Route path="/parent/children" element={<ChildrenScreen />} />
          <Route path="/parent/children/:childId" element={<ChildDashboardScreen />} />
          <Route path="/parent/children/:childId/summary" element={<MonthlySummaryScreen />} />
          <Route path="/parent/children/:childId/report" element={<ParentReportScreen />} />
          <Route path="/parent/children/:childId/wellbeing" element={<WellbeingRedirect />} />
          <Route path="/parent/health" element={<HealthLandingScreen />} />
          <Route path="/parent/health/:childId" element={<HealthScreen />} />
          <Route path="/parent/notices" element={<NoticesScreen />} />
          <Route path="/parent/children/:childId/explore" element={<ExploreLandingScreen />} />
          <Route path="/parent/explore" element={<ExploreLandingScreen />} />
          <Route path="/parent/explore/:childId" element={<ParentExploreScreen />} />
          <Route path="/parent/ask" element={<ParentAskScreen />} />
          <Route path="/parent/siblings" element={<SiblingsScreen />} />
          <Route path="/parent/privacy" element={<PrivacyScreen />} />
          <Route path="/parent/observations" element={<ObservationsScreen />} />
          <Route path="/parent/observations/new" element={<NewObservationScreen />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          isRestoring ? null : (
            // Someone signed in for another app has no home here: back to sign-in, not a redirect loop.
            <Navigate to={user && ROLE_APP[user.role] === 'family' ? ROLE_HOME_PATH[user.role] : '/sign-in'} replace />
          )
        }
      />
    </Routes>
  );
}
