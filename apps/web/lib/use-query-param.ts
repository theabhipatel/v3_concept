"use client";

import { useCallback, useSyncExternalStore } from "react";

// The URL is the source of truth for page filters, so ABI, shared links and the back button agree.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

export function useQueryParam<T extends string>(name: string, fallback: T, allowed: readonly string[]) {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  const raw = new URLSearchParams(search).get(name);
  const value = (raw && allowed.includes(raw) ? raw : fallback) as T;

  const setValue = useCallback(
    (next: T) => {
      const params = new URLSearchParams(window.location.search);
      if (next === fallback) params.delete(name);
      else params.set(name, next);
      const qs = params.toString();
      window.history.replaceState(window.history.state, "", qs ? `?${qs}` : window.location.pathname);
      listeners.forEach((l) => l());
    },
    [name, fallback],
  );

  return [value, setValue] as const;
}
