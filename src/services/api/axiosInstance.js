import axios from "axios";

const MARKET_PROXY_BASE_URL = "/api/market/proxy";

const resolveCoinGeckoBaseUrl = () => {
  const configured = String(import.meta.env.VITE_COINGECKO_API_URL || "").trim();
  if (!configured) return MARKET_PROXY_BASE_URL;

  // Direct browser calls to api.coingecko.com fail CORS; use backend proxy instead.
  if (/api\.coingecko\.com/i.test(configured)) {
    return MARKET_PROXY_BASE_URL;
  }

  return configured;
};

// Axios instances for third-party APIs.
export const coingeckoAxios = axios.create({
  baseURL: resolveCoinGeckoBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const currencyAxios = axios.create({
  baseURL: import.meta.env.VITE_CURRENCY_API_URL, // This reads from .env file
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
