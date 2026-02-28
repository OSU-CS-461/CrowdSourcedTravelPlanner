import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "../functionalAreas/dashboard/pages/HomePage";
import LoginPage from "../functionalAreas/auth/pages/LoginPage";
import SignupPage from "../functionalAreas/auth/pages/SignupPage";
import { useAuth } from "../functionalAreas/auth/hooks/useAuth";
import CreateExperiencePage from "../functionalAreas/experiences/pages/CreateExperiencePage";
import ExperienceDetailsPage from "../functionalAreas/experiences/pages/ExperienceDetailsPage";
import UpdateExperiencePage from "../functionalAreas/experiences/pages/UpdateExperiencePage";
import ReviewForm from "../functionalAreas/reviews/components/ReviewForm";
import CreateTripPage from "../functionalAreas/trips/pages/CreateTripsPage";
import UpdateTripPage from "../functionalAreas/trips/pages/UpdateTripsPage";
import { ClientRoutes } from "./clientRoutes";




export default function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      <header style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 12 }}>
        {isAuthenticated ? <button onClick={logout}>Logout</button> : null}
      </header>

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

        <Route path={ClientRoutes.REVIEW_CREATE} 
        element={<ReviewForm />}
        />

        <Route path={ClientRoutes.REVIEW_UPDATE} 
        element={<UpdateTripPage />}
        />

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
