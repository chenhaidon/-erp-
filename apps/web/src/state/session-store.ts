import type { CurrentUserProfile } from "@smart-erp/shared";
import { useSyncExternalStore } from "react";

type SessionRole = CurrentUserProfile["roles"][number];

type SessionData = {
  accessToken: string;
  refreshToken: string;
  factoryId: string;
  username: string;
  displayName: string;
  permissions: string[];
  roles: SessionRole[];
};

type SessionState = SessionData & {
  setSession: (payload: SessionData) => void;
  syncProfile: (payload: Pick<SessionData, "username" | "displayName" | "permissions" | "roles">) => void;
  setFactoryId: (factoryId: string) => void;
  clear: () => void;
};

const storageKey = "smart-erp-session";

function getEmptySession(): SessionData {
  return {
    accessToken: "",
    refreshToken: "",
    factoryId: "",
    username: "",
    displayName: "",
    permissions: [],
    roles: []
  };
}

function readInitialState(): SessionData {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return getEmptySession();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SessionData>;

    return {
      accessToken: parsed.accessToken ?? "",
      refreshToken: parsed.refreshToken ?? "",
      factoryId: parsed.factoryId ?? "",
      username: parsed.username ?? "",
      displayName: parsed.displayName ?? "",
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions.filter((item): item is string => typeof item === "string") : [],
      roles: Array.isArray(parsed.roles) ? (parsed.roles as SessionRole[]) : []
    };
  } catch {
    return getEmptySession();
  }
}

const listeners = new Set<() => void>();
let session = readInitialState();
let cachedSessionState: SessionState | null = null;

function buildState(): SessionState {
  if (
    cachedSessionState &&
    cachedSessionState.accessToken === session.accessToken &&
    cachedSessionState.refreshToken === session.refreshToken &&
    cachedSessionState.factoryId === session.factoryId &&
    cachedSessionState.username === session.username &&
    cachedSessionState.displayName === session.displayName &&
    cachedSessionState.permissions === session.permissions &&
    cachedSessionState.roles === session.roles
  ) {
    return cachedSessionState;
  }

  cachedSessionState = {
    ...session,
    setSession(payload) {
      session = payload;
      cachedSessionState = null;
      persist();
    },
    syncProfile(payload) {
      session = {
        ...session,
        username: payload.username,
        displayName: payload.displayName,
        permissions: payload.permissions,
        roles: payload.roles
      };
      cachedSessionState = null;
      persist();
    },
    setFactoryId(factoryId) {
      session = { ...session, factoryId };
      cachedSessionState = null;
      persist();
    },
    clear() {
      session = getEmptySession();
      cachedSessionState = null;
      persist();
    }
  };

  return cachedSessionState;
}

function persist() {
  window.localStorage.setItem(storageKey, JSON.stringify(session));
  listeners.forEach((listener) => listener());
}

export function useSessionStore<T>(selector: (state: SessionState) => T): T {
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getSnapshot = () => selector(buildState());

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
