"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3001";

let socket;

function getSocket() {
  if (typeof window === "undefined") return null;
  if (!socket) {
    socket = io(URL);
    socket.on("connect", () => {
      console.log("socket id", socket.id);
    });
    socket.on("connect_error", (error) => {
      console.log("socket error", error.message);
    });
  }
  return socket;
}

if (typeof window !== "undefined") {
  getSocket();
}

export function getSocketId() {
  return getSocket()?.id;
}

export function emit(event, payload) {
  getSocket()?.emit(event, payload);
}

export function on(event, handler) {
  const current = getSocket();
  if (!current) return () => {};
  current.on(event, handler);
  return () => current.off(event, handler);
}

export function useSocketStatus() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const current = getSocket();
    if (!current) return undefined;

    const setOnline = () => setConnected(true);
    const setOffline = () => setConnected(false);

    setConnected(current.connected);
    current.on("connect", setOnline);
    current.on("disconnect", setOffline);

    return () => {
      current.off("connect", setOnline);
      current.off("disconnect", setOffline);
    };
  }, []);

  return connected;
}

export function SocketProvider({ children }) {
  useEffect(() => {
    const current = getSocket();
    if (current && !current.connected) {
      current.connect();
    }
  }, []);

  return children;
}
