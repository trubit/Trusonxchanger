import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requestWithRetry } from "../../api/client.js";
import { queryKeys } from "../../api/queryKeys.js";

export const useNotificationsQuery = (params = {}) =>
  useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn:  () => requestWithRetry({ method: "get", url: "/api/notifications", params }),
    staleTime: 30_000,
  });

export const useUnreadCountQuery = () =>
  useQuery({
    queryKey:       queryKeys.notifications.unreadCount,
    queryFn:        () => requestWithRetry({ method: "get", url: "/api/notifications/unread-count" }),
    staleTime:      30_000,
    refetchInterval: 60_000,
  });

export const useMarkReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) =>
      requestWithRetry({
        method: "post",
        url:    "/api/notifications/mark-read",
        data:   ids?.length ? { ids } : {},
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      qc.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });
};
