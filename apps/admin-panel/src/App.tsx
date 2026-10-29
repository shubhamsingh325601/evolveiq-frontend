import { Navigate, Route, Routes } from 'react-router-dom';
import { ROLE_APP, ROLE_HOME_PATH, RoleGuard, useAuth } from '@evolveiq/auth';
import { AppFrame } from './AppFrame';
import { SignInScreen } from './screens/SignInScreen';
import { ManageStudentsScreen } from './screens/school/ManageStudentsScreen';
import { ManageTeachersScreen } from './screens/school/ManageTeachersScreen';
import { ManageClassesScreen } from './screens/school/ManageClassesScreen';
import { ManageParentsScreen } from './screens/school/ManageParentsScreen';
import { CrmIntegrationScreen } from './screens/school/CrmIntegrationScreen';
import { ManageSchoolsScreen } from './screens/platform/ManageSchoolsScreen';
import { ManageUsersScreen } from './screens/platform/ManageUsersScreen';
import { ImportScreen } from './screens/ImportScreen';
import { NoticesScreen } from './screens/NoticesScreen';
import { StaffReviewsScreen } from './screens/school/StaffReviewsScreen';
import { WallScreen } from './screens/school/WallScreen';

/** Admin panel: School Admin and Platform Admin. */
export function App() {
  const { user, isRestoring } = useAuth();

  return (
    <Routes>
      <Route path="/sign-in" element={<SignInScreen />} />

      <Route element={<RoleGuard allow={['school_admin']} />}>
        <Route element={<AppFrame />}>
          <Route path="/school/students" element={<ManageStudentsScreen />} />
          <Route path="/school/teachers" element={<ManageTeachersScreen />} />
          <Route path="/school/classes" element={<ManageClassesScreen />} />
          <Route path="/school/parents" element={<ManageParentsScreen />} />
          <Route path="/school/integrations" element={<CrmIntegrationScreen />} />
          <Route path="/school/import" element={<ImportScreen />} />
          <Route path="/school/notices" element={<NoticesScreen />} />
          <Route path="/school/staff-reviews" element={<StaffReviewsScreen />} />
          <Route path="/school/wall" element={<WallScreen />} />
        </Route>
      </Route>

      <Route element={<RoleGuard allow={['platform_admin']} />}>
        <Route element={<AppFrame />}>
          <Route path="/platform/schools" element={<ManageSchoolsScreen />} />
          <Route path="/platform/users" element={<ManageUsersScreen />} />
          <Route path="/platform/import" element={<ImportScreen />} />
          <Route path="/platform/notices" element={<NoticesScreen />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          isRestoring ? null : (
            // Someone signed in for another app has no home here: back to sign-in, not a redirect loop.
            <Navigate to={user && ROLE_APP[user.role] === 'admin' ? ROLE_HOME_PATH[user.role] : '/sign-in'} replace />
          )
        }
      />
    </Routes>
  );
}
