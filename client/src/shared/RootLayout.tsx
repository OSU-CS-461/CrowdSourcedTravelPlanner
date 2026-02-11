import { NavLink, Outlet } from "react-router-dom";
import { ClientRoutes } from "./clientRoutes";
import { useAuth } from "../functionalAreas/auth/hooks/useAuth";

export default function RootLayout() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      {isAuthenticated && (
        <nav style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #e5e7eb" }}>
          <NavLink to={ClientRoutes.HOME}>Home</NavLink>

          <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            <button onClick={logout}>Logout</button>
          </div>
        </nav>
      )}

      {/* This is the “body replaced by the router” */}
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </>
  );
}
