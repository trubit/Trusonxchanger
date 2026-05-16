import { requestWithRetry } from "../api/client";

export const subscribeToNewsletter = async (email) =>
  requestWithRetry({
    url: "/api/newsletter/subscribe",
    method: "POST",
    data: { email },
  });

