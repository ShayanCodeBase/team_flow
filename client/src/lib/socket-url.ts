/** Socket.io server origin (API base URL without `/api` suffix). */
export const getSocketServerUrl = (): string => {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string;
  if (!apiBase) {
    return "http://localhost:8000";
  }
  return apiBase.replace(/\/api\/?$/, "");
};
