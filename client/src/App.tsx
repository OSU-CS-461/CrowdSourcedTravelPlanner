import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ExperienceList from "./features/experiences/ExperienceList";
import ExperienceDetail from "./features/experiences/ExperienceDetail";
import { useAuth } from "./hooks/useAuth";
import { useEffect, useState } from "react";
import { exampleRequest, usersExampleRequest } from "./services/api.service";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const { isAuthenticated } = useAuth();

  const [count, setCount] = useState(0);
  const [response, setResponse] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: number }[]>([]);

  useEffect(() => {
    (async () => {
      const res = await exampleRequest();
      setResponse(res);
      const users = await usersExampleRequest();
      setUsers(users);
    })();
  }, []);

  return (
    <Router>
      {isAuthenticated && (
        <nav style={{ marginBottom: "1rem" }}>
          <Link to="/">Home</Link> |{" "}
          <Link to="/experiences">Experiences</Link>
        </nav>
      )}

      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <>
                <HomePage />
                <div>
                  <p>Test API Response: {response}</p>
                  <p>Test db request for users:</p>
                  {users.map((user) => (
                    <p key={user.id}>id: {user.id}</p>
                  ))}
                  <div>
                    <a href="https://vite.dev" target="_blank">
                      <img src={viteLogo} className="logo" alt="Vite logo" />
                    </a>
                    <a href="https://react.dev" target="_blank">
                      <img src={reactLogo} className="logo react" alt="React logo" />
                    </a>
                  </div>
                  <h1>Vite + React</h1>
                  <div className="card">
                    <button onClick={() => setCount((c) => c + 1)}>
                      count is {count}
                    </button>
                    <p>
                      Edit <code>src/App.tsx</code> and save to test HMR
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/experiences"
          element={
            isAuthenticated ? <ExperienceList /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/experiences/:id"
          element={
            isAuthenticated ? <ExperienceDetail /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
