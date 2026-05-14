import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ClientRoutes } from "./clientRoutes";
import { useAuth } from "../functionalAreas/auth/hooks/useAuth";
import { getUserSettings } from "./services/api.service";
import { isUiTheme, setUiTheme } from "./theme";

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

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void getUserSettings()
      .then((s) => {
        if (cancelled) return;
        const t = isUiTheme(s.themePreference) ? s.themePreference : "light";
        setUiTheme(t);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <>
      {isAuthenticated && (
        <nav className="top-site-nav">
          <NavLink to={ClientRoutes.HOME}>Home</NavLink>
          <NavLink to={ClientRoutes.EXPLORE}>Explore</NavLink>
          <NavLink to={ClientRoutes.INTERESTS}>My Interests</NavLink>

          <div ref={profileMenuRef} className="site-nav-profile">
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
              <div className="profile-menu" role="menu">
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
                  to={ClientRoutes.PROFILE_SETTINGS}
                  onClick={() => setIsProfileOpen(false)}
                >
                  Profile settings
                </NavLink>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
