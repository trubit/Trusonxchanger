import { requestWithRetry } from "../../api/client";

const LOCAL_LIKES_KEY = "blogLikes";

const request = (url, options = {}) =>
  requestWithRetry({
    url,
    method: options.method || "GET",
    data: options.body,
    signal: options.signal,
    headers: options.headers,
  });

const safeParseLikes = () => {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_LIKES_KEY) || "{}");
  } catch {
    return {};
  }
};

const getLocalLikes = (id) => {
  if (typeof window === "undefined") return 0;
  const likesById = safeParseLikes();
  const value = Number(likesById[id]);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const setLocalLikes = (id, likes) => {
  if (typeof window === "undefined") return;
  const likesById = safeParseLikes();
  likesById[id] = likes;
  window.localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(likesById));
};

const withLikesFallback = (post) => {
  if (!post) return post;
  if (typeof post.likes === "number") return post;
  return {
    ...post,
    likes: getLocalLikes(post.id || post._id),
  };
};

export const getPost = async (id, options = {}) => {
  const payload = await request(`/api/blogs/${id}`, { 
    method: "GET", 
    signal: options.signal 
  });

  const post = payload?.post || payload?.data || payload;
  return withLikesFallback(post);
};

export const getRelatedPosts = async (id, options = {}) => {
  const payload = await request(`/api/blogs/${id}/related`, {
    method: "GET",
    signal: options.signal,
  });

  const posts = payload?.posts || payload?.data || [];
  return posts.map(withLikesFallback);
};

export const likePost = async (id, options = {}) => {
  const payload = await request(`/api/blogs/${id}/like`, {
    method: "POST",
    signal: options.signal,
  });

  const post = payload?.post || payload?.data || payload;
  const likes = post?.likes;

  if (typeof likes === "number") {
    setLocalLikes(id, likes);
  }

  return post;
};
