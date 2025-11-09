import { createContext } from "react";
import { AuthResponse } from "../services/api.service";

export type AuthContextValue = {
  token: string | null;
  user: AuthResponse["user"] | null;
  initialize: (payload: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

export const TOKEN_STORAGE_KEY = "cstp.auth.token";
export const USER_STORAGE_KEY = "cstp.auth.user";

export const defaultAuthContext: AuthContextValue = {
  token: null,
  user: null,
  initialize: () => {},
  logout: () => {},
  isAuthenticated: false,
};

export const AuthContext = createContext<AuthContextValue>(defaultAuthContext);


