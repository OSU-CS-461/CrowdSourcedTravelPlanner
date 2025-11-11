import { Link, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { useAuth } from "./hooks/useAuth";
import CreateExperiencePage from "./pages/CreateExperiencePage";
import UpdateExperiencePage from "./pages/UpdateExperiencePage";
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
          path={ClientRoutes.EXPERIENCE_UPDATE}
          element={
            <UpdateExperiencePage />}
        />

      </Routes>
    </>
  );
}
