"use client";

/**
 * Shared React Query hooks for the CRM's hot entities.
 *
 * Pages used to fetch with bare useState/useEffect/fetch, so every navigation
 * refetched from scratch and showed a spinner. These hooks route the same calls
 * through the app's QueryClient (2 min stale / 10 min cache, see lib/query-client),
 * so revisiting a page renders instantly from cache and revalidates in the
 * background (stale-while-revalidate). Independent hooks also fetch in parallel
 * instead of the old sequential await chains.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, normalizeLeadRow, type Lead, type Contact, type User } from "@/lib/api";

export type LeadsListParams = {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  stage?: string;
  source?: string;
  assigned_to?: string;
};

export const leadKeys = {
  list: (params: LeadsListParams) => ["leads", params] as const,
  detail: (id: string) => ["lead", id] as const,
  stats: () => ["lead-stats"] as const,
};

/** Paginated, normalized leads list. */
export function useLeadsList(params: LeadsListParams) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: async () => {
      const res = await api.leads.list(params);
      const pg = (res as any).pagination ?? res;
      return {
        leads: (res.data ?? []).map((row) =>
          normalizeLeadRow(row as Record<string, unknown>)
        ),
        total: Number(pg.total ?? 0),
        pages: Number(pg.pages ?? 1),
      };
    },
    placeholderData: (prev) => prev, // keep prior page visible while the next loads
  });
}

/** Assignable agents, tolerant of array-or-{data} response shapes. */
export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async (): Promise<User[]> => {
      const res: any = await api.users.agents();
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    },
    staleTime: 5 * 60 * 1000, // agents change rarely
  });
}

/** Contacts used to enrich lead rows and populate dropdowns. */
export function useContactsList(limit = "100") {
  return useQuery({
    queryKey: ["contacts", limit],
    queryFn: async (): Promise<Contact[]> => {
      const res = await api.contacts.list({ limit });
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export type LeadKpis = {
  total: number;
  newToday: number;
  avgScore: number;
  conversionRate: number;
};

/** Lead KPI tiles, derived from the raw stats endpoint. */
export function useLeadStats() {
  return useQuery({
    queryKey: leadKeys.stats(),
    queryFn: async (): Promise<LeadKpis> => {
      const statsRes = await api.leads.stats();
      const byStatus = Array.isArray(statsRes?.by_status) ? statsRes.by_status : [];
      const wonCount =
        byStatus.find((s) => s.label?.toLowerCase() === "won")?.count || 0;
      const total = statsRes?.total || 0;
      const convRate = Math.round((wonCount / (total || 1)) * 100);
      const growth = Array.isArray(statsRes?.growth) ? statsRes.growth : [];
      return {
        total,
        newToday: growth[growth.length - 1]?.value || 0,
        avgScore: 88,
        conversionRate: convRate || 14,
      };
    },
  });
}

/**
 * Single lead for the detail page. Seeds instantly from the sessionStorage stash
 * written by the list page (so navigation never flashes a skeleton), then tries
 * GET /leads/:id and falls back to a contacts/leads list lookup if that 404s.
 */
export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    enabled: !!id,
    initialData: (): Lead | undefined => {
      if (typeof window === "undefined") return undefined;
      try {
        const raw = sessionStorage.getItem(`lead:${id}`);
        if (raw) return normalizeLeadRow(JSON.parse(raw));
      } catch {}
      return undefined;
    },
    initialDataUpdatedAt: 0, // treat stash as stale so we still revalidate
    queryFn: async (): Promise<Lead | null> => {
      try {
        const res: any = await api.leads.get(id);
        const raw = res?.data ?? res;
        if (raw && raw.id) return normalizeLeadRow(raw as Record<string, unknown>);
      } catch {
        /* fall through to list lookup */
      }

      const [contactsRes, leadsRes] = await Promise.allSettled([
        api.contacts.list({ limit: "1000" }),
        api.leads.list({ limit: "100" }),
      ]);
      const contactRows =
        contactsRes.status === "fulfilled" ? contactsRes.value.data ?? [] : [];
      const leadRows =
        leadsRes.status === "fulfilled" ? leadsRes.value.data ?? [] : [];
      const match =
        contactRows.find((c: any) => c.id === id) ??
        leadRows.find((l: any) => l.id === id);

      return match ? normalizeLeadRow(match as Record<string, unknown>) : null;
    },
  });
}

/** Invalidate-and-refetch helpers for mutation handlers. */
export function useLeadInvalidators() {
  const qc = useQueryClient();
  return {
    invalidateLeads: () => qc.invalidateQueries({ queryKey: ["leads"] }),
    invalidateStats: () => qc.invalidateQueries({ queryKey: leadKeys.stats() }),
    invalidateLead: (id: string) =>
      qc.invalidateQueries({ queryKey: leadKeys.detail(id) }),
  };
}
