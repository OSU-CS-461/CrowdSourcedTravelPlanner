import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ClientRoutes } from "./clientRoutes";
import { useAuth } from "../functionalAreas/auth/hooks/useAuth";

export default function RootLayout() {
  const { isAuthenticated, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  return (
    <>
      {isAuthenticated && (
        <nav
          className="top-site-nav"
          style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 12, borderBottom: "1px solid #e5e7eb", alignItems: "center" }}
        >
          <NavLink to={ClientRoutes.HOME}>Home</NavLink>
          <NavLink to={ClientRoutes.EXPLORE}>Explore</NavLink>
          <NavLink to={ClientRoutes.INTERESTS}>My Interests</NavLink>

          <div
            ref={profileMenuRef}
            style={{ marginLeft: "auto", display: "flex", gap: 12, position: "relative" }}
          >
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
              aria-label="Open menu"
            >
              ☰
            </button>

            {isProfileOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: 180,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                  display: "grid",
                  gap: 4,
                  padding: 8,
                  zIndex: 10,
                }}
              >
                <NavLink
                  to={ClientRoutes.MY_EXPERIENCES}
                  onClick={() => setIsProfileOpen(false)}
                >
                  My Experiences
                </NavLink>

                <NavLink
                  to={ClientRoutes.INTERESTS}
                  onClick={() => setIsProfileOpen(false)}
                >
                  My Interests
                </NavLink>

                <NavLink
                  to={ClientRoutes.MY_TRIPS}
                  onClick={() => setIsProfileOpen(false)}
                >
                  My Trips
                </NavLink>

                <NavLink
                  to={ClientRoutes.SETTINGS}
                  onClick={() => setIsProfileOpen(false)}
                >
                  User Settings
                </NavLink>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  style={{ textAlign: "left" }}
                >
                  Logout
                </button>
              </div>
            )}
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
