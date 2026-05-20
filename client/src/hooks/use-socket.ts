import { useEffect } from "react";
import { connect, disconnect, getSocket } from "@/lib/socket";

/**
 * Connects Socket.io when the user is authenticated; disconnects on logout.
 */
export const useSocket = (isAuthenticated: boolean): ReturnType<typeof getSocket> => {
  useEffect(() => {
    if (!isAuthenticated) {
      disconnect();
      return;
    }

    connect();

    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

  return getSocket();
};
