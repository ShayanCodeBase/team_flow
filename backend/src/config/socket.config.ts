import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { UnauthorizedException } from "../utils/appError";

type SocketHandshakeAuth = {
  token?: string;
};

let ioInstance: Server | null = null;

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized");
  }
  return ioInstance;
};

export const initSocketIO = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    const auth = socket.handshake.auth as SocketHandshakeAuth;
    const token =
      typeof auth.token === "string" ? auth.token.trim() : undefined;

    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const { userId } = verifyAccessToken(token);
      void socket.join(userId);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        socket.disconnect(true);
        return;
      }
      socket.disconnect(true);
    }
  });

  ioInstance = io;
  return io;
};
