import { Navigate, Route, Routes } from "react-router-dom";
import { ClientRoutes } from "./utils/clientRoutes";
import RootLayout from "./layouts/RootLayout";

import HomePage from "./features/dashboard/pages/HomePage";
import LoginPage from "./features/auth/pages/LoginPage";
import SignupPage from "./features/auth/pages/SignupPage";

import UpdateExperiencePage from "./features/experiences/pages/UpdateExperiencePage";

type AppRoutesProps = {
  isAuthenticated: boolean;
};

export default function AppRoutes({ isAuthenticated }: AppRoutesProps) {
  return (
    <Routes>
      {/* Layout route: always rendered; children render into <Outlet /> */}
      <Route element={<RootLayout />}>
        <Route
          path={ClientRoutes.HOME}
          element={
            isAuthenticated ? (
              <HomePage />
            ) : (
              <Navigate to={ClientRoutes.LOGIN} replace />
            )
          }
        />

        <Route
          path={ClientRoutes.LOGIN}
          element={
            !isAuthenticated ? (
              <LoginPage />
            ) : (
              <Navigate to={ClientRoutes.HOME} replace />
            )
          }
        />

        <Route
          path={ClientRoutes.SIGNUP}
          element={
            !isAuthenticated ? (
              <SignupPage />
            ) : (
              <Navigate to={ClientRoutes.HOME} replace />
            )
          }
        />

        <Route
          path={ClientRoutes.EXPERIENCE_UPDATE}
          element={
            isAuthenticated ? (
              <UpdateExperiencePage />
            ) : (
              <Navigate to={ClientRoutes.LOGIN} replace />
            )
          }
        />

        {/* Catch-all LAST */}
        <Route path="*" element={<Navigate to={ClientRoutes.HOME} replace />} />
      </Route>
    </Routes>
  );
}
