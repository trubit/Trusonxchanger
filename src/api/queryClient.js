import { QueryClient } from "@tanstack/react-query";

const MAX_RETRY_ATTEMPTS = 3;

const isRetryableStatus = (status) => {
  if (!status) return true;
  if (status === 408 || status === 409 || status === 425 || status === 429) {
    return true;
  }
  return status >= 500;
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 15 * 60 * 1000,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (failureCount >= MAX_RETRY_ATTEMPTS) return false;
          return isRetryableStatus(error?.status);
        },
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** Math.max(0, attemptIndex), 30_000),
      },
      mutations: {
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false;
          return isRetryableStatus(error?.status);
        },
      },
    },
  });

