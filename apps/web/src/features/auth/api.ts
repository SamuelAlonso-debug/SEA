"use client";

import { apiClient } from "@/lib/api-client";
import type { AuthResponse, User } from "@/types/api";

// El token vive en una cookie httpOnly que pone la API: JavaScript no lo ve ni lo guarda.
export function loginRequest(email: string, password: string) {
  return apiClient.post<AuthResponse>("/auth/login", {
    body: { email, password },
  });
}

export function logoutRequest() {
  return apiClient.post<void>("/auth/logout");
}

export function profileRequest() {
  return apiClient.get<User>("/auth/profile");
}

