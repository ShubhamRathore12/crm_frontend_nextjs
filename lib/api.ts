/**
 * Backend API base URL. In dev, next.config rewrites /api/* to localhost:8080.
 */
const API_BASE =  "https://crm-backend-fastify.onrender.com";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<T> {
  const { params, ...init } = options ?? {};
  const url = new URL(`/api/v1${path}`, API_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  // 204 No Content — nothing to parse
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<unknown>("/health"),

  // ── Auth ──
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; expires_in: number; user: UserResponse }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string) =>
      request<{ token: string; expires_in: number; user: UserResponse }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
    me: () => request<UserResponse>("/auth/me"),
    otp: (email: string, otp: string) =>
      request<{ token: string; expires_in: number; user: UserResponse }>("/auth/otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      }),
    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
    forgotPassword: (email: string) =>
      request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (body: { email: string; otp: string; new_password: string }) =>
      request<{ ok: boolean; message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  // ── Leads ──
  leads: {
    list: (params?: { page?: string; limit?: string; search?: string; status?: string; stage?: string; source?: string; assigned_to?: string }) =>
      request<{ data: Lead[]; total: number; page: number; limit: number; pages: number; hasNext: boolean }>("/leads", params ? { params: params as Record<string, string> } : undefined),
    get: (id: string) => request<Lead>(`/leads/${id}`),
    create: (body: CreateLead) =>
      request<Lead>("/leads", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateLead>) =>
      request<Lead>(`/leads/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/leads/${id}`, { method: "DELETE" }),
    stats: () => request<LeadStats>("/leads/stats"),
    highPriority: (params?: { page?: string; limit?: string }) =>
      request<{ data: Lead[]; total: number }>("/leads/high-priority", params ? { params: params as Record<string, string> } : undefined),
    assign: (id: string, agentId: string) =>
      request<Lead>(`/leads/${id}/assign`, { method: "POST", body: JSON.stringify({ agent_id: agentId }) }),
    history: (id: string) => request<LeadHistory[]>(`/leads/${id}/history`),
    addNote: (id: string, note: string) =>
      request<LeadHistory>(`/leads/${id}/history`, { method: "POST", body: JSON.stringify({ note }) }),
    score: (id: string) => request<LeadScore>(`/leads/${id}/score`),
    bulkAssign: (body: { lead_ids: string[]; agent_ids: string[] }) =>
      request<{ assigned: number }>("/leads/bulk-assign", { method: "POST", body: JSON.stringify(body) }),
  },

  // ── Contacts ──
  contacts: {
    list: (params?: { page?: string; limit?: string; search?: string; ucc_code?: string }) =>
      request<{ data: Contact[]; total: number; page: number; limit: number }>("/contacts", params ? { params: params as Record<string, string> } : undefined),
    get: (id: string) => request<Contact>(`/contacts/${id}`),
    create: (body: CreateContact) =>
      request<Contact>("/contacts", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateContact>) =>
      request<Contact>(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/contacts/${id}`, { method: "DELETE" }),
    import: (contacts: unknown[]) =>
      request<{ imported: number }>("/contacts/bulk-import", {
        method: "POST",
        body: JSON.stringify({ contacts }),
      }),
    bulkDelete: (ids: string[]) =>
      request<{ deleted: number }>("/contacts/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }),
    leads: (id: string) => request<Lead[]>(`/contacts/${id}/leads`),
    interactions: (id: string) => request<Interaction[]>(`/contacts/${id}/interactions`),
    emailHistory: (id: string) => request<EmailSend[]>(`/contacts/${id}/email-history`),
    stats: () => request<{ total: number; recent: number }>("/contacts/stats"),
  },

  // ── Interactions ──
  interactions: {
    list: (params?: { page?: string; limit?: string; channel?: string; status?: string; priority?: string; assigned_to?: string }) =>
      request<{ data: Interaction[]; total: number; page: number; limit: number }>("/interactions", params ? { params: params as Record<string, string> } : undefined),
    get: (id: string) => request<InteractionDetail>(`/interactions/${id}`),
    create: (body: CreateInteraction) =>
      request<Interaction>("/interactions", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateInteraction>) =>
      request<Interaction>(`/interactions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/interactions/${id}`, { method: "DELETE" }),
    stats: () => request<InteractionStats>("/interactions/stats"),
    insights: () => request<unknown[]>("/interactions/insights"),
    messages: (id: string) => request<InteractionMessage[]>(`/interactions/${id}/messages`),
    addMessage: (id: string, body: { content: string; sender?: string }) =>
      request<InteractionMessage>(`/interactions/${id}/messages`, { method: "POST", body: JSON.stringify(body) }),
    escalate: (id: string, body: { reason: string; priority?: string }) =>
      request<unknown>(`/interactions/${id}/escalate`, { method: "POST", body: JSON.stringify(body) }),
    analyze: (id: string) =>
      request<unknown>(`/interactions/${id}/analyze`, { method: "POST" }),
  },

  // ── Opportunities ──
  opportunities: {
    list: (params?: { page?: string; limit?: string; stage?: string; assigned_to?: string }) =>
      request<Opportunity[]>("/opportunities", params ? { params: params as Record<string, string> } : undefined),
    get: (id: string) => request<Opportunity>(`/opportunities/${id}`),
    create: (body: CreateOpportunity) =>
      request<Opportunity>("/opportunities", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateOpportunity>) =>
      request<Opportunity>(`/opportunities/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/opportunities/${id}`, { method: "DELETE" }),
    pipeline: () => request<PipelineStage[]>("/opportunities/pipeline"),
    stats: () => request<OpportunityStats>("/opportunities/stats"),
    bulkUpdateStage: (body: { opportunity_ids: string[]; stage: string }) =>
      request<{ updated: number }>("/opportunities/bulk-update-stage", { method: "POST", body: JSON.stringify(body) }),
  },

  // ── Tasks ──
  tasks: {
    list: (params?: { page?: string; limit?: string; status?: string; priority?: string; assigned_to?: string }) =>
      request<{ data: Task[]; total: number }>("/tasks", params ? { params: params as Record<string, string> } : undefined),
    get: (id: string) => request<Task>(`/tasks/${id}`),
    create: (body: CreateTask) =>
      request<Task>("/tasks", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateTask>) =>
      request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    complete: (id: string) =>
      request<Task>(`/tasks/${id}/complete`, { method: "PUT" }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
    stats: () => request<TaskStats>("/tasks/stats"),
    overdue: () => request<Task[]>("/tasks/overdue"),
  },

  // ── Sales & Marketing ──
  salesMarketing: {
    tasks: {
      list: (filters?: { status?: string; priority?: string; assignee_id?: string }) =>
        request<SalesTask[]>("/sales-marketing/tasks", filters ? { params: filters as Record<string, string> } : undefined),
      get: (id: string) => request<SalesTask>(`/sales-marketing/tasks/${id}`),
      create: (body: CreateSalesTask) =>
        request<SalesTask>("/sales-marketing/tasks", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: Partial<CreateSalesTask>) =>
        request<SalesTask>(`/sales-marketing/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: string) =>
        request<{ ok: boolean }>(`/sales-marketing/tasks/${id}`, { method: "DELETE" }),
      board: () => request<Record<string, SalesTask[]>>("/tasks/sales-marketing/board"),
    },
    forms: {
      list: () => request<SalesForm[]>("/sales-marketing/forms"),
      get: (id: string) => request<SalesForm>(`/sales-marketing/forms/${id}`),
      create: (body: { name: string; description?: string; fields_json?: unknown }) =>
        request<SalesForm>("/sales-marketing/forms", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: { name?: string; description?: string; fields_json?: unknown; is_active?: boolean }) =>
        request<{ ok: boolean }>(`/sales-marketing/forms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: string) =>
        request<{ ok: boolean }>(`/sales-marketing/forms/${id}`, { method: "DELETE" }),
      submit: (id: string, data: unknown) =>
        request<SalesFormSubmission>(`/sales-marketing/forms/${id}/submit`, { method: "POST", body: JSON.stringify({ data_json: data }) }),
      submissions: (id: string) =>
        request<SalesFormSubmission[]>(`/sales-marketing/forms/${id}/submissions`),
    },
  },

  // ── Workflows ──
  workflows: {
    list: (params?: { page?: string; limit?: string; category?: string; is_active?: string }) =>
      request<{ data: Workflow[]; total: number }>("/workflows", params ? { params: params as Record<string, string> } : undefined),
    get: (id: string) => request<WorkflowDetail>(`/workflows/${id}`),
    create: (body: CreateWorkflow) =>
      request<Workflow>("/workflows", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateWorkflow>) =>
      request<Workflow>(`/workflows/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    activate: (id: string) =>
      request<Workflow>(`/workflows/${id}/activate`, { method: "PUT" }),
    deactivate: (id: string) =>
      request<Workflow>(`/workflows/${id}/deactivate`, { method: "PUT" }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/workflows/${id}`, { method: "DELETE" }),
    stats: () => request<WorkflowStats>("/workflows/stats"),
    runs: (id: string, params?: { page?: string; status?: string }) =>
      request<{ data: WorkflowRun[]; total: number }>(`/workflows/${id}/runs`, params ? { params: params as Record<string, string> } : undefined),
    trigger: (id: string, body: { entity_id: string; entity_type: string; trigger_data?: Record<string, unknown> }) =>
      request<{ run_id: string; status: string }>(`/workflows/${id}/trigger`, { method: "POST", body: JSON.stringify(body) }),
  },

  // ── Campaigns ──
  campaigns: {
    list: (params?: { page?: string; limit?: string; status?: string }) =>
      request<{ data: Campaign[]; total: number }>("/campaigns", params ? { params: params as Record<string, string> } : undefined),
    get: (id: string) => request<CampaignDetail>(`/campaigns/${id}`),
    create: (body: CreateCampaign) =>
      request<Campaign>("/campaigns", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateCampaign>) =>
      request<Campaign>(`/campaigns/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/campaigns/${id}`, { method: "DELETE" }),
    send: (id: string) =>
      request<{ ok: boolean }>(`/campaigns/${id}/send`, { method: "POST" }),
    pause: (id: string) =>
      request<{ ok: boolean }>(`/campaigns/${id}/pause`, { method: "POST" }),
    resume: (id: string) =>
      request<{ ok: boolean }>(`/campaigns/${id}/resume`, { method: "POST" }),
    cancel: (id: string) =>
      request<{ ok: boolean }>(`/campaigns/${id}/cancel`, { method: "POST" }),
    preview: (id: string) => request<{ html: string }>(`/campaigns/${id}/preview`),
    logs: (id: string, params?: { page?: string; status?: string }) =>
      request<{ data: EmailSend[]; total: number }>(`/campaigns/${id}/logs`, params ? { params: params as Record<string, string> } : undefined),
    testSend: (id: string, emails: string[]) =>
      request<{ ok: boolean }>(`/campaigns/${id}/test-send`, { method: "POST", body: JSON.stringify({ emails }) }),
  },

  // ── Templates ──
  templates: {
    list: (params?: { page?: string; search?: string }) =>
      request<{ data: EmailTemplate[]; total: number }>("/templates", params ? { params: params as Record<string, string> } : undefined),
    get: (id: string) => request<EmailTemplate>(`/templates/${id}`),
    create: (body: CreateTemplate) =>
      request<EmailTemplate>("/templates", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateTemplate>) =>
      request<EmailTemplate>(`/templates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/templates/${id}`, { method: "DELETE" }),
    preview: (id: string, variables?: Record<string, string>) =>
      request<{ html: string }>(`/templates/${id}/preview`, { method: "POST", body: JSON.stringify({ variables }) }),
    duplicate: (id: string) =>
      request<EmailTemplate>(`/templates/${id}/duplicate`, { method: "POST" }),
  },

  // ── Email ──
  email: {
    sends: (params?: { entity_type?: string; entity_id?: string }) =>
      request<EmailSend[]>(
        "/email-sends",
        params?.entity_type && params?.entity_id
          ? { params: { entity_type: params.entity_type, entity_id: params.entity_id } }
          : undefined
      ),
  },

  // ── Integrations ──
  integrations: {
    list: () => request<Integration[]>("/integrations"),
    get: (id: string) => request<Integration>(`/integrations/${id}`),
    create: (body: { provider: string; name?: string; config: Record<string, string> }) =>
      request<Integration>("/integrations", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; config: Record<string, string> }>) =>
      request<Integration>(`/integrations/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/integrations/${id}`, { method: "DELETE" }),
    activate: (id: string) =>
      request<Integration>(`/integrations/${id}/activate`, { method: "PUT" }),
    deactivate: (id: string) =>
      request<Integration>(`/integrations/${id}/deactivate`, { method: "PUT" }),
    meetingInvite: (body: {
      to_email: string;
      contact_id?: string;
      subject: string;
      body: string;
      calendly_link?: string;
    }) =>
      request<{ ok: boolean; invite_id: string; tracking_id: string; message: string }>(
        "/integrations/meeting-invite",
        { method: "POST", body: JSON.stringify(body) }
      ),
    calendlyLink: (contact_email?: string) =>
      request<{ link: string }>("/integrations/calendly/link", {
        method: "POST",
        body: JSON.stringify({ contact_email }),
      }),
    slackNotify: (message: string, channel?: string) =>
      request<{ ok: boolean }>("/integrations/slack/notify", {
        method: "POST",
        body: JSON.stringify({ message, channel }),
      }),
    connections: {
      list: () =>
        request<Integration[]>("/integrations/connections"),
      create: (body: { provider: string; name?: string; config: Record<string, string> }) =>
        request<Integration>("/integrations/connections", { method: "POST", body: JSON.stringify(body) }),
    },
  },

  // ── Users ──
  users: {
    list: (params?: { page?: string; role?: string; status?: string; search?: string }) =>
      request<{ data: User[]; total: number }>("/users", params ? { params: params as Record<string, string> } : undefined),
    get: (id: string) => request<User>(`/users/${id}`),
    create: (body: { name: string; email: string; role: string; password: string }) =>
      request<User>("/users", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; email: string; role: string; status: string }>) =>
      request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/users/${id}`, { method: "DELETE" }),
    agents: () => request<User[]>("/users/agents"),
    activity: (id: string) => request<UserActivity>(`/users/${id}/activity`),
  },

  // ── Teams ──
  teams: {
    list: () => request<Team[]>("/users/teams"),
    get: (id: string) => request<TeamDetail>(`/users/teams/${id}`),
    create: (body: { name: string; manager_id?: string }) =>
      request<Team>("/users/teams", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: { name?: string; manager_id?: string }) =>
      request<Team>(`/users/teams/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => request<{ ok: boolean }>(`/users/teams/${id}`, { method: "DELETE" }),
    members: {
      list: (id: string) => request<User[]>(`/users/teams/${id}/members`),
      add: (id: string, userId: string) =>
        request<unknown>(`/users/teams/${id}/members`, { method: "POST", body: JSON.stringify({ user_id: userId }) }),
      remove: (id: string, userId: string) =>
        request<unknown>(`/users/teams/${id}/members/${userId}`, { method: "DELETE" }),
    },
  },

  // ── Analytics ──
  analytics: {
    overview: () => request<AnalyticsOverview>("/analytics/overview"),
    leads: () => request<LeadStats>("/analytics/leads"),
    interactions: () => request<InteractionStats>("/analytics/interactions"),
    opportunities: () => request<OpportunityStats>("/analytics/opportunities"),
    overall: () => request<OverallStats>("/analytics/overall"),
    health: () => request<SystemHealth>("/analytics/health"),
    providers: () => request<unknown>("/analytics/providers"),
    queue: () => request<unknown>("/analytics/queue"),
  },

  // ── Attachments ──
  attachments: {
    list: (params?: { entity_type: string; entity_id: string }) =>
      request<Attachment[]>("/attachments", params ? { params } : undefined),
    delete: (id: string) => request<{ ok: boolean }>(`/attachments/${id}`, { method: "DELETE" }),
  },

  // ── Bulk Uploads ──
  bulkUploads: {
    list: () => request<BulkUpload[]>("/bulk-uploads"),
    get: (id: string) => request<BulkUpload>(`/bulk-uploads/${id}`),
    create: (body: { file_name: string; entity_type: string }) =>
      request<BulkUpload>("/bulk-uploads", { method: "POST", body: JSON.stringify(body) }),
  },

  // ── Fields ──
  fields: {
    list: (entityType?: string) =>
      request<FieldDefinition[]>("/integrations/fields", entityType ? { params: { entity_type: entityType } } : undefined),
    get: (id: string) => request<FieldDefinition>(`/integrations/fields/${id}`),
    create: (body: CreateField) =>
      request<FieldDefinition>("/integrations/fields", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateField>) =>
      request<FieldDefinition>(`/integrations/fields/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => request<{ ok: boolean }>(`/integrations/fields/${id}`, { method: "DELETE" }),
  },

  // ── Emails (Inbox) ──
  emails: {
    list: () => request<InboundEmail[]>("/email-inbound/list"),
    detail: (id: string) => request<InboundEmailDetail>(`/email-inbound/${id}`),
  },

  // ── Maintenance ──
  maintenance: {
    runArchive: () => request<unknown>("/maintenance/archive/run", { method: "POST" }),
  },
};

// ── Types ──

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  team_id: string | null;
  status: "active" | "inactive" | "deleted";
  created_at: string;
};

export type UserActivity = {
  leads: number;
  tasks: number;
  opportunities: number;
  interactions: number;
};

export type Lead = {
  id: string;
  contact_id: string | null;
  source: string;
  status: string;
  stage: string;
  assigned_to: string | null;
  product: string;
  campaign: string;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  contacts: {
    name: string;
    email: string;
    mobile: string;
  };
  lead_scores: {
    score: number;
    confidence: number;
  } | null;
};

export type CreateLead = {
  contact_id?: string;
  source: string;
  status?: string;
  stage?: string;
  assigned_to?: string;
  product?: string;
  campaign?: string;
  custom_fields?: Record<string, unknown>;
};

export type LeadHistory = {
  id: string;
  lead_id: string;
  action: string;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};

export type LeadScore = {
  id: string;
  lead_id: string;
  score: number;
  factors: Record<string, number>;
  created_at: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  ucc_code: string | null;
  pan: string | null;
  company: string | null;
  designation: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateContact = {
  name: string;
  email: string;
  phone?: string;
  ucc_code?: string;
  pan?: string;
  company?: string;
  designation?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
};

export type Interaction = {
  id: string;
  contact_id: string | null;
  contact_name?: string;
  channel: "email" | "phone" | "sms" | "chat" | "whatsapp";
  status: "new" | "assigned" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  subject: string;
  assigned_to: string | null;
  assigned_name?: string;
  created_at: string;
  updated_at: string;
};

export type InteractionDetail = Interaction & {
  messages: InteractionMessage[];
  escalations: unknown[];
  analysis: unknown | null;
};

export type InteractionMessage = {
  id: string;
  interaction_id: string;
  sender: string;
  content: string;
  created_at: string;
};

export type CreateInteraction = {
  contact_id?: string;
  channel: string;
  subject: string;
  priority?: string;
  assigned_to?: string;
  initial_message?: string;
};

export type Opportunity = {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  value: string | null;
  currency: string | null;
  stage: "discovery" | "proposal" | "negotiation" | "won" | "lost";
  probability: number | null;
  expected_closed_at: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateOpportunity = {
  lead_id: string;
  title: string;
  description?: string;
  value?: number;
  currency?: string;
  stage?: string;
  probability?: number;
  expected_closed_at?: string;
  assigned_to?: string;
};

export type PipelineStage = {
  stage: string;
  count: number;
  totalValue: number;
  weightedValue: number;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  assigned_to: string | null;
  entity_type: string | null;
  entity_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
};

export type CreateTask = {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  entity_type?: string;
  entity_id?: string;
  due_date?: string;
};

export type TaskStats = {
  total: number;
  by_status: { label: string; count: number }[];
  by_priority: { label: string; count: number }[];
  overdue: number;
};

export type SalesTask = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "ready_for_launch" | "launched" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  assignee_id: string | null;
  tags: string[];
  start_date: string | null;
  end_date: string | null;
  estimated_hours: number;
  effort_hours: number;
  category: string;
  department: string;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSalesTask = {
  title: string;
  description?: string;
  status?: SalesTask["status"];
  priority?: SalesTask["priority"];
  assignee_id?: string;
  tags?: string[];
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  effort_hours?: number;
  category?: string;
  department?: string;
  parent_task_id?: string;
};

export type Workflow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  version: number;
  definition_json: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkflowDetail = Workflow & {
  triggers: WorkflowTrigger[];
  schedules: WorkflowSchedule[];
};

export type CreateWorkflow = {
  name: string;
  description?: string;
  category?: string;
  definition_json: unknown;
};

export type WorkflowTrigger = {
  id: string;
  workflow_id: string;
  event_type: string;
  conditions: unknown;
  is_active: boolean;
};

export type WorkflowSchedule = {
  id: string;
  workflow_id: string;
  cron_expression: string;
  is_active: boolean;
};

export type WorkflowRun = {
  id: string;
  workflow_id: string;
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  error: string | null;
};

export type WorkflowStats = {
  total: number;
  active: number;
  total_runs: number;
  success_rate: number;
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "paused" | "completed" | "cancelled";
  template_id: string | null;
  scheduled_at: string | null;
  sent_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
};

export type CampaignDetail = Campaign & {
  template: EmailTemplate | null;
  stats: {
    delivered: number;
    bounced: number;
    complained: number;
  };
};

export type CreateCampaign = {
  name: string;
  subject: string;
  template_id?: string;
  scheduled_at?: string;
  segment_query?: unknown;
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  variables: string[];
  created_at: string;
  updated_at: string;
};

export type CreateTemplate = {
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  variables?: string[];
};

export type Integration = {
  id: string;
  provider: string;
  name: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};

export type Attachment = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  entity_type: "lead" | "contact" | "interaction" | "opportunity" | "task";
  entity_id: string;
  uploaded_by: string | null;
  created_at: string;
};

export type BulkUpload = {
  id: string;
  file_name: string;
  entity_type: "contact" | "lead";
  status: "pending" | "processing" | "completed" | "failed";
  total_rows: number | null;
  processed_rows: number | null;
  failed_rows: number | null;
  error_log: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
};

export type FieldDefinition = {
  id: string;
  entity_type: string;
  field_name: string;
  label: string;
  field_type: "text" | "number" | "select" | "boolean" | "date";
  options: unknown | null;
  is_required: boolean;
  is_system: boolean;
  display_order: number;
};

export type CreateField = {
  entity_type: string;
  field_name: string;
  label: string;
  field_type: string;
  options?: unknown;
  is_required?: boolean;
  display_order?: number;
};

export type Team = {
  id: string;
  name: string;
  manager_id: string | null;
  member_count?: number;
  created_at: string;
};

export type TeamDetail = Team & {
  members: User[];
};

export type LeadStats = {
  total: number;
  by_status: { label: string; count: number }[];
  by_source: { label: string; count: number }[];
  growth: { label: string; value: number }[];
};

export type InteractionStats = {
  total: number;
  by_channel: { label: string; count: number }[];
  by_priority: { label: string; count: number }[];
};

export type OpportunityStats = {
  total: number;
  total_value: number;
  by_stage: { label: string; count: number; value: number }[];
};

export type OverallStats = {
  leads: number;
  interactions: number;
  opportunities: number;
  tasks: number;
};

export type AnalyticsOverview = {
  leads: { total: number; new_today: number };
  opportunities: { total: number; total_value: number };
  tasks: { total: number; overdue: number };
  interactions: { total: number; open: number };
  campaigns: { total: number; active: number };
  emails: { sent: number; opened: number };
};

export type SystemHealth = {
  status: string;
  uptime: number;
  database: string;
  redis: string;
  queue: string;
};

export type InboundEmail = {
  id: string;
  contact_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  subject: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  latest_message: string | null;
  created_at: string;
};

export type InboundEmailDetail = {
  id: string;
  contact_id: string | null;
  subject: string;
  status: string;
  messages: {
    id: string;
    sender: string;
    content: string;
    created_at: string;
  }[];
};

export type EmailSend = {
  id: string;
  tracking_id: string;
  to_email: string;
  subject: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type SalesForm = {
  id: string;
  name: string;
  description: string;
  fields_json: unknown;
  is_active: boolean;
  open_count: number;
  closed_count: number;
  created_at: string;
  updated_at: string;
};

export type SalesFormSubmission = {
  id: string;
  form_id: string;
  data_json: unknown;
  status: "open" | "closed";
  submitted_at: string;
};
