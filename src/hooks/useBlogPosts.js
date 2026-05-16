import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBlogPostsQuery } from "./queries/useBlogPostsQuery";
import { queryKeys } from "../api/queryKeys";

export const useBlogPosts = () => {
  const queryClient = useQueryClient();
  const query = useBlogPostsQuery();

  const setPosts = useCallback(
    (updater) => {
      const entries = queryClient.getQueriesData({ queryKey: queryKeys.blogs.all });
      entries.forEach(([cacheKey, value]) => {
        if (!Array.isArray(value)) return;
        const nextValue = typeof updater === "function" ? updater(value) : updater;
        queryClient.setQueryData(cacheKey, nextValue);
      });
    },
    [queryClient],
  );

  return {
    posts: query.posts,
    visiblePosts: query.visiblePosts,
    loading: query.isLoading,
    error: query.error?.message || "",
    refresh: query.refetch,
    setPosts,
  };
};
