import { httpClient } from "./httpClient";

export const currencyService = {
  getLatestFromUsd: async () => {
    const { data } = await httpClient.get("/api/currency/latest?from=USD");
    return data;
  },
};
