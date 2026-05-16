import { requestWithRetry } from "../../api/client";

export const fetchCoins = async () => {
  return requestWithRetry({
    url: "/api/coins",
    method: "GET",
  });
};
