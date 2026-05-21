import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setAuthToken } from "../../../shared/services/api.service";
import {
  AuthContext,
  TOKEN_STORAGE_KEY,
  USER_ID_STORAGE_KEY,
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
    const tokenFromStorage = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);
    let parsedUser: AuthContextValue["user"] | null = null;

    if (rawUser) {
      try {
        parsedUser = JSON.parse(rawUser) as AuthContextValue["user"];
      } catch {
        parsedUser = null;
      }
    }

    if (parsedUser?.id !== undefined && parsedUser?.id !== null) {
      return parsedUser;
    }

    const legacyUserId = window.localStorage.getItem(USER_ID_STORAGE_KEY);
    if (legacyUserId) {
      return {
        id: legacyUserId,
        email: parsedUser?.email ?? "",
        username: parsedUser?.username,
      };
    }

    if (tokenFromStorage) {
      try {
        const payload = JSON.parse(atob(tokenFromStorage.split(".")[1])) as {
          id?: string | number;
        };
        if (payload.id !== undefined && payload.id !== null) {
          return {
            id: payload.id,
            email: parsedUser?.email ?? "",
            username: parsedUser?.username,
          };
        }
      } catch {
        return null;
      }
    }

    return null;
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const initialize = useCallback<AuthContextValue["initialize"]>((payload) => {
    setAuthToken(payload.token);
    setToken(payload.token);
    setUser(payload.user);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
      window.localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(payload.user)
      );
      if (payload.user?.id !== undefined && payload.user?.id !== null) {
        window.localStorage.setItem(USER_ID_STORAGE_KEY, String(payload.user.id));
      } else {
        window.localStorage.removeItem(USER_ID_STORAGE_KEY);
      }
    }
  }, []);

  const logout = useCallback<AuthContextValue["logout"]>(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(USER_STORAGE_KEY);
      window.localStorage.removeItem(USER_ID_STORAGE_KEY);
    }
    setAuthToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      initialize,
      logout,
      isAuthenticated: Boolean(token && user?.id !== undefined && user?.id !== null),
    }),
    [token, user, initialize, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
