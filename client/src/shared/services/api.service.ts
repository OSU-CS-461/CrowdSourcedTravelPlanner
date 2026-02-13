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

export type Interest = {
  id: number;
  name: string;
  description?: string;
  dateCreated: string;
  lastUpdated: string;
  createdBy: number;
};

export const getInterests = async () => {
  const response = await apiClient.get<Interest[]>("/interests");
  return response.data;
};

export const getInterest = async (id: number) => {
  const response = await apiClient.get<Interest>(`/interests/${id}`);
  return response.data;
};

export const createInterest = async (input: {
  name: string;
  description?: string;
}) => {
  const response = await apiClient.post<Interest>("/interests", input);
  return response.data;
};

export const updateInterest = async (id: number, input: {
  name: string;
  description?: string;
}) => {
  const response = await apiClient.put<Interest>(`/interests/${id}`, input);
  return response.data;
};

export const deleteInterest = async (id: number) => {
  await apiClient.delete(`/interests/${id}`);
};