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
import CreateReviewPage from "../functionalAreas/reviews/pages/CreateReviewPage";
import CreateTripPage from "../functionalAreas/trips/pages/CreateTripsPage";
import UpdateTripPage from "../functionalAreas/trips/pages/UpdateTripsPage";
import InterestsPage from "../functionalAreas/interests/pages/InterestsPage";
import { ClientRoutes } from "./clientRoutes";
import RootLayout from "./RootLayout";
import ExplorePage from "../functionalAreas/experiences/pages/ExplorePage";
import MyExperiencesPage from "../functionalAreas/experiences/pages/MyExperiencesPage";
import TripDetailsPage from "../functionalAreas/trips/pages/TripDetailsPage";
import MediaGalleryPage from "../functionalAreas/experiences/pages/MediaGalleryPage";

export default function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path={ClientRoutes.LOGIN} element={<LoginPage />} />
        <Route path={ClientRoutes.SIGNUP} element={<SignupPage />} />
        <Route
          path="*"
          element={<Navigate to={ClientRoutes.LOGIN} replace />}
        />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path={ClientRoutes.HOME} element={<HomePage />} />
        <Route
          path={ClientRoutes.MY_EXPERIENCES}
          element={<MyExperiencesPage />}
        />
        <Route path={ClientRoutes.EXPLORE} element={<ExplorePage />} />
        <Route
          path={ClientRoutes.EXPERIENCE_CREATE}
          element={<CreateExperiencePage />}
        />
        <Route path={ClientRoutes.EXPERIENCE_DETAILS}>
          <Route index element={<ExperienceDetailsPage />} />
          <Route path="photos" element={<MediaGalleryPage />} />
        </Route>
        <Route
          path={ClientRoutes.EXPERIENCE_UPDATE}
          element={<UpdateExperiencePage />}
        />
        <Route
          path={ClientRoutes.REVIEW_CREATE}
          element={<CreateReviewPage />}
        />
        <Route
          path={ClientRoutes.REVIEW_UPDATE}
          element={<ReviewForm onSuccess={undefined} />}
        />
        <Route path={ClientRoutes.TRIP_CREATE} element={<CreateTripPage />} />
        <Route path={ClientRoutes.TRIP_UPDATE} element={<UpdateTripPage />} />
        <Route
          path={ClientRoutes.LOGIN}
          element={<Navigate to={ClientRoutes.HOME} replace />}
        />
        <Route
          path={ClientRoutes.SIGNUP}
          element={<Navigate to={ClientRoutes.HOME} replace />}
        />
        <Route path={ClientRoutes.INTERESTS} element={<InterestsPage />} />
        <Route path="*" element={<Navigate to={ClientRoutes.HOME} replace />} />
      </Route>

      <Route path={ClientRoutes.TRIP_DETAILS} element={<TripDetailsPage />} />
    </Routes>
  );
}
