import axios from "axios";

const API_BASE = import.meta.env.DEV ? "http://localhost:10000/api" : "/api";

export type AuthResponse = {
  token: string;
  user: {
    id: string | number;
    email: string;
    username?: string;
  };
};

export const apiClient = axios.create({
  baseURL: API_BASE,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const authLogin = async (email: string, password: string) => {
  const response = await apiClient.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return response.data;
};

export const authSignup = async (input: {
  username: string;
  email: string;
  password: string;
}) => {
  const response = await apiClient.post<AuthResponse>("/auth/register", input);
  return response.data;
};
