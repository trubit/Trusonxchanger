import axios from "axios";

// Axios instances for third-party APIs with base URLs from env.
export const coingeckoAxios = axios.create({
  baseURL: import.meta.env.VITE_COINGECKO_API_URL, // This reads from .env file
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
