// Re-export all types from the original api.ts
export type {
  UserResponse,
  User,
  UserActivity,
  Lead,
  CreateLead,
  LeadHistory,
  LeadScore,
  Contact,
  CreateContact,
  Interaction,
  InteractionDetail,
  InteractionMessage,
  CreateInteraction,
  Opportunity,
  CreateOpportunity,
  PipelineStage,
  Task,
  CreateTask,
  TaskStats,
  SalesTask,
  CreateSalesTask,
  Workflow,
  WorkflowDetail,
  CreateWorkflow,
  WorkflowTrigger,
  WorkflowSchedule,
  WorkflowRun,
  WorkflowStats,
  Campaign,
  CampaignDetail,
  CreateCampaign,
  EmailTemplate,
  CreateTemplate,
  Integration,
  Attachment,
  BulkUpload,
  FieldDefinition,
} from "@/lib/api";

// Additional types for API responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages?: number;
  hasNext?: boolean;
}

export interface StatsResponse {
  total: number;
  by_status?: Array<{ label: string; count: number }>;
  by_stage?: Array<{ label: string; count: number }>;
  by_source?: Array<{ label: string; count: number }>;
  by_channel?: Array<{ label: string; count: number }>;
  by_priority?: Array<{ label: string; count: number }>;
}

export interface AnalyticsOverview {
  leads: StatsResponse;
  opportunities: StatsResponse;
  tasks: StatsResponse;
  interactions: StatsResponse;
  contacts: { total: number; recent: number };
  campaigns: { total: number; totalSent: number; totalFailed: number };
  emails: { total: number; read: number; readRate: string };
  period?: { days: number };
}

export interface LeadStats extends StatsResponse {
  converted?: number;
  high_priority?: number;
}

export interface OpportunityStats extends StatsResponse {
  totalPipelineValue: number;
}

export interface InteractionStats extends StatsResponse {
  resolved?: number;
  escalated?: number;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  services: Record<string, { status: string; latency?: number }>;
  timestamp: string;
}

export interface OverallStats {
  totalRevenue: number;
  activeUsers: number;
  conversionRate: number;
  growthRate: number;
}