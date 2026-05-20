let accessToken: string | null = null;
const tokenListeners = new Set<() => void>();

const notifyTokenChange = (): void => {
  tokenListeners.forEach((listener) => listener());
};

export const getAccessToken = (): string | null => accessToken;

export const subscribeAccessTokenChange = (listener: () => void): (() => void) => {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
};

export const setAccessToken = (token: string): void => {
  accessToken = token;
  notifyTokenChange();
};

export const clearAccessToken = (): void => {
  accessToken = null;
  notifyTokenChange();
};
