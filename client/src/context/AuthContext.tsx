import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setAuthToken } from "../services/api.service";
import {
  AuthContext,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  type AuthContextValue,
} from "./auth-context";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [user, setUser] = useState<AuthContextValue["user"]>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!rawUser) {
      return null;
    }
    try {
      return JSON.parse(rawUser) as AuthContextValue["user"];
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const initialize = useCallback<AuthContextValue["initialize"]>((payload) => {
    setToken(payload.token);
    setUser(payload.user);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
      window.localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(payload.user)
      );
    }
  }, []);

  const logout = useCallback<AuthContextValue["logout"]>(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
    setAuthToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      initialize,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token, user, initialize, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
