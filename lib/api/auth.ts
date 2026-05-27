import { apiClient } from "./client";
import { UserResponse } from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ token: string; expires_in: number; user: UserResponse }>("/auth/login", { email, password }),

  register: (name: string, email: string, password: string) =>
    apiClient.post<{ token: string; expires_in: number; user: UserResponse }>("/auth/register", { name, email, password }),

  me: () => apiClient.get<UserResponse>("/auth/me"),

  otp: (email: string, otp: string) =>
    apiClient.post<{ token: string; expires_in: number; user: UserResponse }>("/auth/otp", { email, otp }),

  logout: () => apiClient.post<{ ok: boolean }>("/auth/logout"),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>("/auth/forgot-password", { email }),

  resetPassword: (body: { email: string; otp: string; new_password: string }) =>
    apiClient.post<{ ok: boolean; message: string }>("/auth/reset-password", body),
};