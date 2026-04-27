const API_BASE_URL =
  import.meta.env.VITE_TRUSON_API_URL ||
  import.meta.env.VITE_API_URL ||
  "";

const LOCAL_LIKES_KEY = "blogLikes";

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const tryRequest = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const payload = await parseJson(response);

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
};

const request = async (path, options = {}) => {
  const result = await tryRequest(path, options);

  if (!result.ok) {
    const message = result.payload?.message || "Request failed";
    throw new Error(message);
  }

  return result.payload;
};

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
