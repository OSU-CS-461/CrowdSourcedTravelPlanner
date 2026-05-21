import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { NavLink, Outlet } from "react-router-dom";
import { ClientRoutes } from "./clientRoutes";
import { useAuth } from "../functionalAreas/auth/hooks/useAuth";
import { getUserSettings } from "./services/api.service";
import { isUiTheme, setUiTheme } from "./theme";
import crowdCompassIcon from "../../logo.png";

export default function RootLayout() {
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
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
      .catch((error) => {
        if (cancelled) return;
        if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          logout();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <>
      {isAuthenticated && (
        <nav className="top-site-nav" aria-label="Primary navigation">
          <NavLink to={ClientRoutes.HOME} className="site-brand" aria-label="Crowd Compass home">
            <img className="site-brand-icon" src={crowdCompassIcon} alt="Crowd Compass home" />
            <span className="site-brand-label">CrowdCompass</span>
          </NavLink>

          <div className="top-site-nav-links">
            <NavLink
              to={ClientRoutes.HOME}
              className={({ isActive }) => `top-site-nav-link${isActive ? " is-active" : ""}`}
            >
              Home
            </NavLink>
            <NavLink
              to={ClientRoutes.EXPLORE}
              className={({ isActive }) => `top-site-nav-link${isActive ? " is-active" : ""}`}
            >
              Explore
            </NavLink>
            <NavLink
              to={ClientRoutes.INTERESTS}
              className={({ isActive }) => `top-site-nav-link${isActive ? " is-active" : ""}`}
            >
              My Interests
            </NavLink>
            <NavLink
              to={ClientRoutes.MY_TRIPS}
              className={({ isActive }) => `top-site-nav-link${isActive ? " is-active" : ""}`}
            >
              My Trips
            </NavLink>
            <NavLink
              to={ClientRoutes.MY_EXPERIENCES}
              className={({ isActive }) => `top-site-nav-link${isActive ? " is-active" : ""}`}
            >
              My Experiences
            </NavLink>
          </div>

          <div ref={profileMenuRef} className="site-nav-profile">
            <button
              type="button"
              className="site-nav-menu-toggle"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Open navigation menu"
            >
              ☰
            </button>

            {isMenuOpen && (
              <div className="profile-menu" role="menu">
                <NavLink
                  to={ClientRoutes.HOME}
                  className="profile-menu__mobile-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </NavLink>
                <NavLink
                  to={ClientRoutes.EXPLORE}
                  className="profile-menu__mobile-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Explore
                </NavLink>
                <NavLink
                  to={ClientRoutes.INTERESTS}
                  className="profile-menu__mobile-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Interests
                </NavLink>
                <NavLink
                  to={ClientRoutes.MY_TRIPS}
                  className="profile-menu__mobile-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Trips
                </NavLink>
                <NavLink
                  to={ClientRoutes.MY_EXPERIENCES}
                  className="profile-menu__mobile-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Experiences
                </NavLink>
                <NavLink
                  to={ClientRoutes.PROFILE_SETTINGS}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </NavLink>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
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
