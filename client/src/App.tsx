import { Link, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./features/dashboard/pages/HomePage";
import LoginPage from "./features/auth/pages/LoginPage";
import SignupPage from "./features/auth/pages/SignupPage";
import { useAuth } from "./features/auth/hooks/useAuth";
import CreateExperiencePage from "./features/experiences/pages/CreateExperiencePage";
import ExperienceDetailsPage from "./features/experiences/pages/ExperienceDetailsPage";
import UpdateExperiencePage from "./features/experiences/pages/UpdateExperiencePage";
import CreateTripPage from "./features/trips/pages/CreateTripsPage";
import UpdateTripPage from "./features/trips/pages/UpdateTripsPage";
import { ClientRoutes } from "./utils/clientRoutes";




export default function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <>
          <Link to={ClientRoutes.LOGIN}>Login</Link>
          <Link to={ClientRoutes.SIGNUP}>Signup</Link>
        </>
      )}

      <Routes>
        <Route
          path={ClientRoutes.HOME}
          element={
            isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path={ClientRoutes.LOGIN}
          element={
            !isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />
          }
        />
        <Route
          path={ClientRoutes.SIGNUP}
          element={
            !isAuthenticated ? <SignupPage /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />

        <Route
          path={ClientRoutes.EXPERIENCE_CREATE}
          element={
            <CreateExperiencePage />}
        />
        <Route
          path={ClientRoutes.EXPERIENCE_DETAILS}
          element={<ExperienceDetailsPage />}
        />
        <Route
          path={ClientRoutes.EXPERIENCE_UPDATE}
          element={
            <UpdateExperiencePage />}
        />

        <Route path={ClientRoutes.TRIP_CREATE} 
        element={<CreateTripPage />}
        />

        <Route path={ClientRoutes.TRIP_UPDATE} 
        element={<UpdateTripPage />}
        />

      </Routes>
    </>
  );
}
