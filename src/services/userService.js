import { httpClient } from "./httpClient";

export const userService = {
  list: async () => {
    const { data } = await httpClient.get("/api/users");
    return data;
  },
  getProfile: async () => {
    const { data } = await httpClient.get("/api/auth/me");
    return data;
  },
};
