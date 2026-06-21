"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type ModulePermissions, type PermAction } from "@/lib/api";

type PermMap = Record<string, ModulePermissions>;

type PermissionContextValue = {
  loading: boolean;
  isAdmin: boolean;
  role: string | null;
  perms: PermMap;
  /** True if the current user may perform `action` on `module`. */
  can: (module: string, action?: PermAction) => boolean;
  refresh: () => void;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

// Until permissions load (or if the RBAC endpoint is unavailable) we fail OPEN
// so the UI is never blocked — the backend still enforces real authorization.
const ALLOW_ALL: ModulePermissions = { read: true, write: true, edit: true, delete: true };

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [perms, setPerms] = useState<PermMap>({});
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.accessControl
      .me()
      .then((data) => {
        if (cancelled) return;
        setIsAdmin(data.is_admin);
        setRole(data.role);
        setPerms(data.permissions || {});
        setLoaded(true);
      })
      .catch(() => {
        // RBAC unavailable — degrade gracefully (fail open).
        if (!cancelled) setLoaded(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const value = useMemo<PermissionContextValue>(() => {
    const can = (module: string, action: PermAction = "read") => {
      if (isAdmin) return true;
      if (!loaded) return true; // not yet known → don't block
      const mp = perms[module] ?? ALLOW_ALL;
      return !!mp[action];
    };
    return { loading, isAdmin, role, perms, can, refresh: () => setTick((t) => t + 1) };
  }, [loading, isAdmin, role, perms, loaded]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    // Provider not mounted — fail open so isolated components still render.
    return {
      loading: false,
      isAdmin: false,
      role: null,
      perms: {},
      can: () => true,
      refresh: () => {},
    };
  }
  return ctx;
}

/** Convenience hook: `const canEdit = useCan("opportunities", "edit")`. */
export function useCan(module: string, action: PermAction = "read"): boolean {
  return usePermissions().can(module, action);
}

/**
 * Gate UI by permission.
 * <Can module="opportunities" action="delete"><DeleteBtn/></Can>
 */
export function Can({
  module,
  action = "read",
  children,
  fallback = null,
}: {
  module: string;
  action?: PermAction;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const allowed = useCan(module, action);
  return <>{allowed ? children : fallback}</>;
}
