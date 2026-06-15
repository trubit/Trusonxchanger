import { requestWithRetry } from "../../api/client.js";

/** Returns the complete list of supported assets (built-in + custom DB coins). */
export const fetchSupportedAssets = () =>
  requestWithRetry({ method: "GET", url: "/api/coins/assets" });
