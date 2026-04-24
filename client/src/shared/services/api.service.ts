import axios from "axios";

const API_BASE = "/api";

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

export type LikedExperienceSummary = {
  id: number;
  title: string;
  thumbnail?: string | null;
  city?: string | null;
  country?: string | null;
  createdByUsername?: string | null;
  dateCreated: string;
};

export type LikedTagSummary = {
  id: number;
  slug: string;
  label: string;
  categoryId: number;
  category?: { id: number; slug: string; label: string };
};

export const getMyLikedExperiencesStatus = async (experienceId: number) => {
  const response = await apiClient.get<{ liked: boolean }>(
    `/users/me/liked-experiences/status/${experienceId}`
  );
  return response.data;
};

export const getMyLikedExperiences = async () => {
  const response = await apiClient.get<LikedExperienceSummary[]>(
    "/users/me/liked-experiences"
  );
  return response.data;
};

export const likeExperience = async (experienceId: number) => {
  await apiClient.post("/users/me/liked-experiences", { experienceId });
};

export const unlikeExperience = async (experienceId: number) => {
  await apiClient.delete(`/users/me/liked-experiences/${experienceId}`);
};

export type LikedTripSummary = {
  id: number;
  title: string;
  dateCreated: string;
  createdByUsername?: string | null;
};

export const getMyLikedTripsStatus = async (tripId: number) => {
  const response = await apiClient.get<{ liked: boolean }>(
    `/users/me/liked-trips/status/${tripId}`
  );
  return response.data;
};

export const getMyLikedTrips = async () => {
  const response = await apiClient.get<LikedTripSummary[]>(
    "/users/me/liked-trips"
  );
  return response.data;
};

export const likeTrip = async (tripId: number) => {
  await apiClient.post("/users/me/liked-trips", { tripId });
};

export const unlikeTrip = async (tripId: number) => {
  await apiClient.delete(`/users/me/liked-trips/${tripId}`);
};

export const getTagById = async (id: number) => {
  const response = await apiClient.get<LikedTagSummary>(`/tags/${id}`);
  return response.data;
};

export const getMyLikedTagsStatus = async (tagId: number) => {
  const response = await apiClient.get<{ liked: boolean }>(
    `/users/me/liked-tags/status/${tagId}`
  );
  return response.data;
};

export const getMyLikedTags = async () => {
  const response = await apiClient.get<LikedTagSummary[]>("/users/me/liked-tags");
  return response.data;
};

export const likeTag = async (tagId: number) => {
  await apiClient.post("/users/me/liked-tags", { tagId });
};

export const unlikeTag = async (tagId: number) => {
  await apiClient.delete(`/users/me/liked-tags/${tagId}`);
};