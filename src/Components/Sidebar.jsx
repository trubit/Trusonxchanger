import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LikeButton from "./sidebar/LikeButton";
import ShareSection from "./sidebar/ShareSection";
import RelatedPosts from "./sidebar/RelatedPosts";
import { getPost, getRelatedPosts, likePost } from "../api/posts";
import "../styles/blog-sidebar.css";

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

const extractPost = (payload) => {
  if (!payload) return null;
  if (payload.post && typeof payload.post === "object") return payload.post;
  if (payload.data && typeof payload.data === "object") return payload.data;
  if (payload.id) return payload;
  return null;
};

const extractPosts = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.posts)) return payload.posts;
  if (Array.isArray(payload.related)) return payload.related;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
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

const areSamePost = (a, b) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    getPostKey(a) === getPostKey(b) &&
    String(a.updatedAt || "") === String(b.updatedAt || "") &&
    String(a.likes ?? "") === String(b.likes ?? "") &&
    String(a.title || "") === String(b.title || "") &&
    String(a.description || "") === String(b.description || "")
  );
};

const areSamePostList = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (!areSamePost(a[index], b[index])) return false;
  }
  return true;
};

const Sidebar = ({ postId, onPostUpdate }) => {
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [postLoading, setPostLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [postError, setPostError] = useState("");
  const [relatedError, setRelatedError] = useState("");
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeError, setLikeError] = useState("");
  const [likes, setLikes] = useState(0);
  const isFetchingRef = useRef(false);

  const syncMainPost = useCallback(
    (nextPost) => {
      if (typeof onPostUpdate === "function") {
        onPostUpdate(nextPost);
      }
    },
    [onPostUpdate],
  );

  const refreshSidebarData = useCallback(async () => {
    if (!postId || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      const [postPayload, relatedPayload] = await Promise.all([
        getPost(postId),
        getRelatedPosts(postId),
      ]);

      const normalizedPost = normalizePost(extractPost(postPayload));
      const currentId = String(postId || normalizedPost?.id || "");
      const seen = new Set();
      const normalizedRelated = extractPosts(relatedPayload)
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

      setPost((prev) => (areSamePost(prev, normalizedPost) ? prev : normalizedPost));
      setLikes((prev) => {
        const next = normalizedPost?.likes || 0;
        return prev === next ? prev : next;
      });
      setRelatedPosts((prev) =>
        areSamePostList(prev, normalizedRelated) ? prev : normalizedRelated,
      );
      setPostError("");
      setRelatedError("");
      syncMainPost(normalizedPost);
    } catch (error) {
      const message = error?.message || "Unable to refresh sidebar.";
      setPostError(message);
      setRelatedError(message);
    } finally {
      setPostLoading(false);
      setRelatedLoading(false);
      isFetchingRef.current = false;
    }
  }, [postId, syncMainPost]);

  useEffect(() => {
    setPostLoading(true);
    setRelatedLoading(true);
    setPostError("");
    setRelatedError("");
    setLikeError("");
    refreshSidebarData();

    const intervalId = window.setInterval(refreshSidebarData, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshSidebarData]);

  useEffect(() => {
    setLikeLoading(false);
  }, [postId]);

  useEffect(() => {
    if (!post) return;
    syncMainPost(post);
  }, [post, syncMainPost]);

  const handleLike = useCallback(async () => {
    if (!postId || likeLoading) return;

    setLikeError("");
    setLikeLoading(true);
    setLikes((prev) => prev + 1);

    try {
      const response = await likePost(postId);
      const serverPost = extractPost(response);
      const nextLikes =
        serverPost?.likes ?? response?.likes ?? response?.data?.likes ?? null;

      if (typeof nextLikes === "number") {
        setLikes(nextLikes);
        setPost((prev) => (prev ? { ...prev, likes: nextLikes } : prev));
      } else {
        refreshSidebarData();
      }
    } catch (error) {
      setLikes((prev) => Math.max(prev - 1, 0));
      setLikeError(error?.message || "Unable to like this post.");
    } finally {
      setLikeLoading(false);
    }
  }, [likeLoading, postId, refreshSidebarData]);

  const handleSelectRelated = useCallback(
    (selectedPost) => {
      const targetId =
        selectedPost?.slug || selectedPost?.id || selectedPost?._id;
      if (!targetId) return;
      navigate(`/blogs/${targetId}`);
    },
    [navigate],
  );

  const postForShare = useMemo(() => post || { id: postId }, [post, postId]);

  return (
    <aside className="crypto-sidebar">
      <div className="crypto-sidebar-shell">
        <section className="crypto-sidebar-section crypto-context-section">
          <p className="crypto-context-kicker">Article Snapshot</p>
          <h3 className="crypto-context-title">{post?.title || "Loading..."}</h3>
          {post?.excerpt ? (
            <p className="crypto-context-excerpt">{post.excerpt}</p>
          ) : null}
          <div className="crypto-context-meta">
            {post?.displayDate ? (
              <span>
                <i className="bi bi-calendar3" aria-hidden="true" />
                {post.displayDate}
              </span>
            ) : null}
            {post?.readTime ? (
              <span>
                <i className="bi bi-clock-history" aria-hidden="true" />
                {post.readTime} min read
              </span>
            ) : null}
            {post?.tag ? (
              <span>
                <i className="bi bi-bookmark-star" aria-hidden="true" />
                {post.tag}
              </span>
            ) : null}
          </div>
        </section>
        <LikeButton
          likes={likes}
          onLike={handleLike}
          loading={likeLoading || postLoading}
          error={likeError}
        />
        <ShareSection post={postForShare} />
        <RelatedPosts
          posts={relatedPosts}
          loading={relatedLoading}
          error={relatedError}
          activeId={postId}
          onSelect={handleSelectRelated}
        />
        {postError ? <p className="crypto-inline-error">{postError}</p> : null}
      </div>
    </aside>
  );
};

export default Sidebar;
