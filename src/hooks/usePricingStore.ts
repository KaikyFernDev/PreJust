import { useCallback, useEffect, useState } from "react";

import {
  emptyProfile,
  type FinancialProfile,
  type SavedService,
} from "@/lib/pricing";

const PROFILE_KEY = "precifica.profile.v1";
const SERVICES_KEY = "precifica.services.v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export interface PricingStore {
  hydrated: boolean;
  profile: FinancialProfile;
  services: SavedService[];
  setProfile: (updater: Partial<FinancialProfile>) => void;
  saveService: (service: Omit<SavedService, "id" | "createdAt">) => void;
  removeService: (id: string) => void;
  reset: () => void;
}

export function usePricingStore(): PricingStore {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfileState] = useState<FinancialProfile>(emptyProfile);
  const [services, setServices] = useState<SavedService[]>([]);

  useEffect(() => {
    setProfileState(read<FinancialProfile>(PROFILE_KEY, emptyProfile()));
    setServices(readArray<SavedService>(SERVICES_KEY));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
  }, [services, hydrated]);

  const setProfile = useCallback((updater: Partial<FinancialProfile>) => {
    setProfileState((prev) => ({ ...prev, ...updater }));
  }, []);

  const saveService = useCallback(
    (service: Omit<SavedService, "id" | "createdAt">) => {
      setServices((prev) => [
        {
          ...service,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const removeService = useCallback((id: string) => {
    setServices((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    setProfileState(emptyProfile());
    setServices([]);
  }, []);

  return { hydrated, profile, services, setProfile, saveService, removeService, reset };
}
