import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { fetchDashboard } from "../../services/api/dashboard";
import { useAuthStore } from "../../store/authStore";

export const useDashboardQuery = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: fetchDashboard,
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
};
