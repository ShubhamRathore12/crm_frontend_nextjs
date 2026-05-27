import { apiClient } from "./client";
import { Lead, CreateLead, LeadHistory, LeadScore, LeadStats, PaginatedResponse } from "./types";

export const leadsApi = {
  list: (params?: {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    stage?: string;
    source?: string;
    assigned_to?: string;
  }) =>
    apiClient.get<PaginatedResponse<Lead>>("/leads", params as Record<string, string>),

  get: (id: string) => apiClient.get<Lead>(`/leads/${id}`),

  create: (body: CreateLead) => apiClient.post<Lead>("/leads", body),

  update: (id: string, body: Partial<CreateLead>) =>
    apiClient.put<Lead>(`/leads/${id}`, body),

  delete: (id: string) => apiClient.delete<{ ok: boolean }>(`/leads/${id}`),

  stats: () => apiClient.get<LeadStats>("/leads/stats"),

  highPriority: (params?: { page?: string; limit?: string }) =>
    apiClient.get<{ data: Lead[]; total: number }>(
      "/leads/high-priority",
      params as Record<string, string>
    ),

  assign: (id: string, agentId: string) =>
    apiClient.post<Lead>(`/leads/${id}/assign`, { agent_id: agentId }),

  history: (id: string) => apiClient.get<LeadHistory[]>(`/leads/${id}/history`),

  addNote: (id: string, note: string) =>
    apiClient.post<LeadHistory>(`/leads/${id}/history`, { note }),

  score: (id: string) => apiClient.get<LeadScore>(`/leads/${id}/score`),

  bulkAssign: (body: { lead_ids: string[]; agent_ids: string[] }) =>
    apiClient.post<{ assigned: number }>("/leads/bulk-assign", body),
};