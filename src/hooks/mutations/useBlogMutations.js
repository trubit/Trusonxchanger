import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { createBlog, deleteBlog, updateBlog } from "../../services/api/blogs";

const updateBlogsCache = (queryClient, updater) => {
  const cachedQueries = queryClient.getQueriesData({ queryKey: queryKeys.blogs.all });
  cachedQueries.forEach(([cacheKey, cacheValue]) => {
    if (!Array.isArray(cacheValue)) return;
    queryClient.setQueryData(cacheKey, updater(cacheValue));
  });
};

export const useCreateBlogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBlog,
    onSuccess: (payload) => {
      const nextPost = payload?.post;
      if (!nextPost) return;
      updateBlogsCache(queryClient, (posts) => [nextPost, ...posts]);
    },
  });
};

export const useUpdateBlogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateBlog(id, payload),
    onSuccess: (payload) => {
      const nextPost = payload?.post;
      if (!nextPost) return;
      updateBlogsCache(queryClient, (posts) =>
        posts.map((post) => (post.id === nextPost.id ? nextPost : post)),
      );
    },
  });
};

export const useDeleteBlogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBlog,
    onSuccess: (_payload, id) => {
      updateBlogsCache(queryClient, (posts) => posts.filter((post) => post.id !== id));
    },
  });
};

