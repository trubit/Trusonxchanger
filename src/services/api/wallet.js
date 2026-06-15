import { requestWithRetry } from "../../api/client.js";

export const walletApi = {
  getWallets: () =>
    requestWithRetry({ method: "get", url: "/api/wallets" }),

  getTransactions: (params = {}) =>
    requestWithRetry({ method: "get", url: "/api/wallets/transactions", params }),

  deposit: (payload) =>
    requestWithRetry({ method: "post", url: "/api/wallets/deposit", data: payload }, { retries: 0 }),

  withdraw: (payload) =>
    requestWithRetry({ method: "post", url: "/api/wallets/withdraw", data: payload }, { retries: 0 }),
};
