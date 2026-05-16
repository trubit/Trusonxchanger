import { requestWithRetry } from "../../api/client";

// Fetch latest currency rates against USD via backend proxy.
const getCurrency = (from = "USD") =>
  requestWithRetry({
    url: "/api/currency/latest",
    method: "GET",
    params: { from },
  });

export default getCurrency;
