import { requestWithRetry } from "../../api/client";

const request = (url, options = {}) =>
  requestWithRetry({
    url,
    method: options.method || "GET",
    data: options.body,
    signal: options.signal,
    headers: options.headers,
  });

export const listBlogs = (params = {}) => {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", params.limit);
  if (params.sort) search.set("sort", params.sort);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return request(`/api/blogs${suffix}`, { method: "GET" });
};

export const getBlog = (id) => request(`/api/blogs/${id}`, { method: "GET" });

export const createBlog = (payload) =>
  request("/api/blogs", {
    method: "POST",
    body: payload,
  });

export const updateBlog = (id, payload) =>
  request(`/api/blogs/${id}`, {
    method: "PUT",
    body: payload,
  });

export const deleteBlog = (id) =>
  request(`/api/blogs/${id}`, { method: "DELETE" });
