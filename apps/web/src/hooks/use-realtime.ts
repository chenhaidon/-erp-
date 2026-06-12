import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace("/api", "");

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(`${SOCKET_URL}/events`, { autoConnect: false });
  }
  return socket;
}

export function useRealtimeConnection(accessToken: string, factoryId: string) {
  useEffect(() => {
    if (!accessToken) return;
    const s = getSocket();
    if (!s.connected) s.connect();

    s.on("connect", () => {
      s.emit("authenticate", { token: accessToken, factoryId });
    });

    return () => {
      s.off("connect");
    };
  }, [accessToken, factoryId]);
}

export function useRealtimeEvent<T = unknown>(event: string, callback: (data: T) => void) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const s = getSocket();
    const handler = (data: T) => cbRef.current(data);
    s.on(event, handler);
    return () => { s.off(event, handler); };
  }, [event]);
}
