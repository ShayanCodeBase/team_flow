import { io, Socket } from "socket.io-client";
import {
  getAccessToken,
  subscribeAccessTokenChange,
} from "./auth-token";
import { getSocketServerUrl } from "./socket-url";

let socket: Socket | null = null;
let tokenUnsubscribe: (() => void) | null = null;

const buildSocket = (token: string): Socket =>
  io(getSocketServerUrl(), {
    auth: { token },
    autoConnect: true,
    reconnection: true,
  });

export const connect = (): Socket | null => {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  disconnect();

  socket = buildSocket(token);

  if (!tokenUnsubscribe) {
    tokenUnsubscribe = subscribeAccessTokenChange(() => {
      const nextToken = getAccessToken();
      if (!nextToken) {
        disconnect();
        return;
      }
      if (socket) {
        socket.auth = { token: nextToken };
        socket.disconnect();
        socket.connect();
        return;
      }
      connect();
    });
  }

  return socket;
};

export const disconnect = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;
