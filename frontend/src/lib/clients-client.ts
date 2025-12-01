// src/lib/clients-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import { getToken } from "@/lib/auth-client";
import type {
  ClientDto,
  ClientsListResponse,
  CreateClientRequest,
  UpdateClientRequest,
} from "@/types/api";

export type GetClientsParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

function withToken() {
  return { token: getToken() };
}

export const clientsClient = {
  // GET /api/clients
  list: (params: GetClientsParams = {}) =>
    apiClient.get<ClientsListResponse>("/clients", {
      ...withToken(),
      query: params,
    }),

  // GET /api/clients/:id
  getById: (id: string) =>
    apiClient.get<ClientDto>(`/clients/${id}`, {
      ...withToken(),
    }),

  // POST /api/clients
  create: (input: CreateClientRequest) =>
    apiClient.post<ClientDto>("/clients", {
      ...withToken(),
      body: input,
    }),

  // PUT /api/clients/:id
  update: (id: string, input: UpdateClientRequest) =>
    apiClient.put<ClientDto>(`/clients/${id}`, {
      ...withToken(),
      body: input,
    }),

  // DELETE /api/clients/:id
  remove: (id: string) =>
    apiClient.delete<void>(`/clients/${id}`, {
      ...withToken(),
    }),
};

// Wrappers con nombres cómodos, igual que en expenses-client
export const getClients = (params?: GetClientsParams) =>
  clientsClient.list(params ?? {});

export const createClient = (input: CreateClientRequest) =>
  clientsClient.create(input);

export const getClientById = (id: string) => clientsClient.getById(id);

export const updateClient = (id: string, input: UpdateClientRequest) =>
  clientsClient.update(id, input);

export const deleteClient = (id: string) => clientsClient.remove(id);

// Re-export de tipos por conveniencia
export type { ClientDto, ClientsListResponse, CreateClientRequest, UpdateClientRequest };
