import { requestWithRetry } from "../../api/client.js";

export const fetchDashboard = () =>
  requestWithRetry({ method: "get", url: "/api/dashboard" });
