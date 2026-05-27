// Main API exports
export { apiClient } from "./client";
export * from "./types";

// API modules
export { authApi } from "./auth";
export { leadsApi } from "./leads";

// Re-export the original API for backward compatibility
import { api as originalApi } from "../api";
export const api = originalApi;