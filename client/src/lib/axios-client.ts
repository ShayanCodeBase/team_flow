import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toApiError } from "./api-error";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./auth-token";
import { unwrapApiData, type ApiSuccessEnvelope } from "./api-response";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const options = {
  baseURL,
  withCredentials: true,
  timeout: 30000,
};

const API = axios.create(options);

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processRefreshQueue = (error: unknown, token: string | null = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  refreshQueue = [];
};

const isRefreshEndpoint = (url?: string): boolean =>
  Boolean(url?.includes("/auth/refresh"));

const isOAuthCallbackPage = (): boolean =>
  window.location.pathname.startsWith("/google/oauth/callback");

API.interceptors.request.use((config) => {
  // Refresh uses httpOnly cookie only — never send a (possibly stale) Bearer token
  if (isRefreshEndpoint(config.url)) {
    return config;
  }

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshEndpoint(originalRequest.url)
    ) {
      return Promise.reject(toApiError(error));
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return API(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;
    const hadAccessToken = Boolean(getAccessToken());

    try {
      const response = await API.post<
        ApiSuccessEnvelope<{ accessToken: string }>
      >("/auth/refresh");
      const { accessToken } = unwrapApiData(response.data);
      setAccessToken(accessToken);
      processRefreshQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return API(originalRequest);
    } catch (refreshError) {
      processRefreshQueue(refreshError, null);
      clearAccessToken();
      // Avoid redirect during OAuth callback or cold bootstrap — let those routes handle auth
      if (hadAccessToken && !isOAuthCallbackPage()) {
        window.location.href = "/";
      }
      return Promise.reject(toApiError(refreshError, "Your session has expired. Please sign in again."));
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;
