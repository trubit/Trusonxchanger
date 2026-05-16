import { httpClient } from "./httpClient";

export const walletService = {
  list: async () => {
    const { data } = await httpClient.get("/api/wallets");
    return data;
  },
};
