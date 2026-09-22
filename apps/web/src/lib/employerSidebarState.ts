"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "qelsa_employer_sidebar_collapsed";

// Memory cache that survives client-side page transitions in Next.js Pages router
let cachedCollapsed: boolean | null = null;
const listeners = new Set<(collapsed: boolean) => void>();

export function getEmployerSidebarCollapsed(): boolean {
  if (cachedCollapsed !== null) {
    return cachedCollapsed;
  }
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        cachedCollapsed = saved === "true";
        return cachedCollapsed;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

export function setEmployerSidebarCollapsed(val: boolean) {
  cachedCollapsed = val;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, String(val));
    } catch {
      // ignore
    }
  }
  listeners.forEach((listener) => listener(val));
}

export function toggleEmployerSidebarCollapsed(): boolean {
  const next = !getEmployerSidebarCollapsed();
  setEmployerSidebarCollapsed(next);
  return next;
}

export function useEmployerSidebar() {
  const [collapsed, setCollapsedState] = useState(getEmployerSidebarCollapsed);

  useEffect(() => {
    // Sync initial state upon client mount
    const current = getEmployerSidebarCollapsed();
    if (collapsed !== current) {
      setCollapsedState(current);
    }

    const onChange = (next: boolean) => {
      setCollapsedState(next);
    };
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [collapsed]);

  const toggle = useCallback(() => {
    toggleEmployerSidebarCollapsed();
  }, []);

  return {
    isCollapsed: collapsed,
    toggle,
    setCollapsed: setEmployerSidebarCollapsed,
  };
}
