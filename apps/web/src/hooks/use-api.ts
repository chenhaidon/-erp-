import { useMemo } from "react";
import { attachInterceptors } from "../lib/api";
import { useSessionStore } from "../state/session-store";

export function useApiBootstrap() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const factoryId = useSessionStore((state) => state.factoryId);
  const clear = useSessionStore((state) => state.clear);

  // useMemo runs synchronously during render, before children mount and fire requests
  useMemo(() => {
    attachInterceptors(() => ({ accessToken, factoryId, clear }));
  }, [accessToken, clear, factoryId]);
}
