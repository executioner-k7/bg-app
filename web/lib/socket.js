"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL;
console.log("Socket URL:", URL);

const socket = io(URL, {
  autoConnect: false,
});

export function getSocketId() {
  return socket.id;
}

export function emit(event, payload) {
  socket.emit(event, payload);
}

export function on(event, handler) {
  socket.on(event, handler);
  return () => socket.off(event, handler);
}

export function useSocketStatus() {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const setOnline = () => setConnected(true);
    const setOffline = () => setConnected(false);

    socket.on("connect", setOnline);
    socket.on("disconnect", setOffline);

    return () => {
      socket.off("connect", setOnline);
      socket.off("disconnect", setOffline);
    };
  }, []);

  return connected;
}

export function SocketProvider({ children }) {
  useEffect(() => {
    socket.connect();
    console.log('socket connected')
    return () => {
      socket.disconnect();
      console.log('socket disconnected')
    };
  }, []);

  return children;
}
