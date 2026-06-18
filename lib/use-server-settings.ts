"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Backend-backed settings hook. Loads a settings group from the server on
 * mount and persists changes via the API (api.settings, stored in the shared
 * integrations key-value store). Mirrors the useLocalSettings interface so
 * components can swap in/out, with an extra `saving` flag and async `save`.
 */
export function useServerSettings<T extends Record<string, unknown>>(
  key: string,
  defaults: T
): {
  settings: T;
  setSetting: <K extends keyof T>(field: K, value: T[K]) => void;
  setMany: (patch: Partial<T>) => void;
  save: () => Promise<void>;
  reset: () => void;
  dirty: boolean;
  loaded: boolean;
  saving: boolean;
} {
  const [settings, setSettings] = useState<T>(defaults);
  const [saved, setSaved] = useState<T>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const remote = await api.settings.get<Partial<T>>(key);
        if (active && remote) {
          const merged = { ...defaults, ...remote };
          setSettings(merged);
          setSaved(merged);
        }
      } catch {
        /* fall back to defaults if the request fails */
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setSetting = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setMany = useCallback((patch: Partial<T>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api.settings.save(key, settings);
      setSaved(settings);
    } finally {
      setSaving(false);
    }
  }, [key, settings]);

  const reset = useCallback(() => {
    setSettings(saved);
  }, [saved]);

  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);

  return { settings, setSetting, setMany, save, reset, dirty, loaded, saving };
}
