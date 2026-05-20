import {
  getCurrentUserQueryFn,
  initializeAuthSession,
} from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useAuth = () => {
  const query = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      await initializeAuthSession();
      return getCurrentUserQueryFn();
    },
    staleTime: 0,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401 || status === 403) {
        return false;
      }
      return failureCount < 1;
    },
  });
  return query;
};

export default useAuth;
