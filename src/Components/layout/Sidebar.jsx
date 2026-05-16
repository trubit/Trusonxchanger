import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LikeButton from "./LikeButton";
import ShareSection from "./ShareSection";
import RelatedPosts from "./RelatedPosts";
import { getPost, getRelatedPosts, likePost } from "../../services/api/posts";
import { queryKeys } from "../../api/queryKeys";
import "../../styles/blog-sidebar.css";

const POLL_INTERVAL_MS = 8000;
const API_ORIGIN =
  import.meta.env.VITE_TRUSON_API_URL || import.meta.env.VITE_API_URL || "";

const resolveImageUrl = (value) => {
  if (!value) return "";
  if (/^(https?:)?\/\//i.test(value)) return value;
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (!API_ORIGIN) return value;
  if (value.startsWith("/")) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
};

const stripHtml = (value) =>
  (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const makeExcerpt = (value, limit = 110) => {
  const plain = stripHtml(value);
  if (!plain) return "";
  if (plain.length <= limit) return plain;
  return `${plain.slice(0, limit).trim()}...`;
};

const estimateReadTime = (value) => {
  const plain = stripHtml(value);
  if (!plain) return 0;
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const normalizePost = (post) => {
  if (!post) return null;
  return {
    ...post,
    imageUrl: resolveImageUrl(post.image),
    excerpt: post.excerpt || makeExcerpt(post.description),
    displayDate: post.date || formatDate(post.updatedAt || post.createdAt),
    readTime: estimateReadTime(post.description || post.excerpt),
  };
};

const getPostKey = (post) => String(post?.id || post?._id || post?.slug || "");

const getSortTime = (post) => {
  const value = post?.updatedAt || post?.createdAt || post?.date;
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
};

const Sidebar = ({ postId, onPostUpdate }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [likeError, setLikeError] = useState("");

  const postQuery = useQuery({
    queryKey: queryKeys.blogs.detail(postId),
    queryFn: () => getPost(postId),
    enabled: Boolean(postId),
    refetchInterval: POLL_INTERVAL_MS,
    select: normalizePost,
  });

  const relatedQuery = useQuery({
    queryKey: queryKeys.blogs.related(postId),
    queryFn: () => getRelatedPosts(postId),
    enabled: Boolean(postId),
    refetchInterval: POLL_INTERVAL_MS,
    select: (posts) => {
      const currentId = String(postId || "");
      const seen = new Set();
      return (posts || [])
        .map(normalizePost)
        .filter((item) => {
          const key = getPostKey(item);
          if (!key || key === currentId) return false;
          if (seen.has(key)) return false;
          seen.add(key);
          return Boolean(item?.title && (item?.excerpt || item?.description));
        })
        .sort((a, b) => getSortTime(b) - getSortTime(a))
        .slice(0, 5);
    },
  });

  useEffect(() => {
    if (!postQuery.data || typeof onPostUpdate !== "function") return;
    onPostUpdate(postQuery.data);
  }, [onPostUpdate, postQuery.data]);

  const likeMutation = useMutation({
    mutationFn: () => likePost(postId),
    onMutate: async () => {
      setLikeError("");
      await queryClient.cancelQueries({ queryKey: queryKeys.blogs.detail(postId) });
      const previous = queryClient.getQueryData(queryKeys.blogs.detail(postId));

      queryClient.setQueryData(queryKeys.blogs.detail(postId), (current) => {
        if (!current) return current;
        return { ...current, likes: Number(current.likes || 0) + 1 };
      });

      return { previous };
    },
    onError: (error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.blogs.detail(postId), context.previous);
      }
      setLikeError(error?.message || "Unable to like this post.");
    },
    onSuccess: (serverPost) => {
      if (!serverPost) return;
      queryClient.setQueryData(queryKeys.blogs.detail(postId), normalizePost(serverPost));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.blogs.detail(postId) });
    },
  });

  const handleSelectRelated = useCallback(
    (selectedPost) => {
      const targetId =
        selectedPost?.slug || selectedPost?.id || selectedPost?._id;
      if (!targetId) return;
      navigate(`/blogs/${targetId}`);
    },
    [navigate],
  );

  const likes = Number(postQuery.data?.likes || 0);
  const postForShare = useMemo(
    () => postQuery.data || { id: postId },
    [postId, postQuery.data],
  );

  return (
    <aside className="crypto-sidebar">
      <div className="crypto-sidebar-shell">
        <section className="crypto-sidebar-section crypto-context-section">
          <p className="crypto-context-kicker">Article Snapshot</p>
          <h3 className="crypto-context-title">
            {postQuery.data?.title || "Loading..."}
          </h3>
          {postQuery.data?.excerpt ? (
            <p className="crypto-context-excerpt">{postQuery.data.excerpt}</p>
          ) : null}
          <div className="crypto-context-meta">
            {postQuery.data?.displayDate ? (
              <span>
                <i className="bi bi-calendar3" aria-hidden="true" />
                {postQuery.data.displayDate}
              </span>
            ) : null}
            {postQuery.data?.readTime ? (
              <span>
                <i className="bi bi-clock-history" aria-hidden="true" />
                {postQuery.data.readTime} min read
              </span>
            ) : null}
            {postQuery.data?.tag ? (
              <span>
                <i className="bi bi-bookmark-star" aria-hidden="true" />
                {postQuery.data.tag}
              </span>
            ) : null}
          </div>
        </section>
        <LikeButton
          likes={likes}
          onLike={() => likeMutation.mutate()}
          loading={likeMutation.isPending || postQuery.isLoading}
          error={likeError}
        />
        <ShareSection post={postForShare} />
        <RelatedPosts
          posts={relatedQuery.data || []}
          loading={relatedQuery.isLoading}
          error={relatedQuery.error?.message || ""}
          activeId={postId}
          onSelect={handleSelectRelated}
        />
        {postQuery.error ? (
          <p className="crypto-inline-error">{postQuery.error.message}</p>
        ) : null}
      </div>
    </aside>
  );
};

export default Sidebar;

