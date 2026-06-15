import { httpClient, request } from "./httpClient";
import { coingeckoAxios } from "./api/axiosInstance";

const COIN_IDS = [
  "bitcoin",
  "ethereum",
  "binancecoin",
  "solana",
  "ripple",
  "cardano",
  "dogecoin",
  "chainlink",
];

const COIN_ID_TO_SYMBOL = {
  bitcoin: "BTCUSDT",
  ethereum: "ETHUSDT",
  binancecoin: "BNBUSDT",
  solana: "SOLUSDT",
  ripple: "XRPUSDT",
  cardano: "ADAUSDT",
  dogecoin: "DOGEUSDT",
  chainlink: "LINKUSDT",
};

const apiRequest = async (path, options = {}) =>
  request({
    url: path,
    method: options.method || "GET",
    data: options.body,
    params: options.params,
    headers: options.headers || {},
    signal: options.signal,
  });

const safeRound = (value, precision = 8) =>
  Number(Number(value || 0).toFixed(precision));

const createBookSide = (lastPrice, side) => {
  const levels = [];
  for (let index = 0; index < 16; index += 1) {
    const drift = (index + 1) * 0.0008;
    const price =
      side === "bid"
        ? lastPrice * (1 - drift)
        : lastPrice * (1 + drift);
    const amount = Math.random() * 0.7 + 0.02;
    levels.push({
      price: safeRound(price, 4),
      amount: safeRound(amount, 6),
      total: safeRound(price * amount, 4),
    });
  }
  return levels;
};

const createFallbackTrades = (symbol, lastPrice) => {
  const now = Date.now();
  return Array.from({ length: 26 }, (_, index) => {
    const drift = (Math.random() - 0.5) * 0.006;
    const price = safeRound(lastPrice * (1 + drift), 4);
    const amount = safeRound(Math.random() * 0.35 + 0.001, 6);
    return {
      id: `${symbol}-${now}-${index}`,
      symbol,
      side: index % 2 === 0 ? "buy" : "sell",
      price,
      amount,
      status: "closed",
      executedAt: new Date(now - index * 22000).toISOString(),
      createdAt: new Date(now - index * 22000).toISOString(),
    };
  });
};

const mapCoinToPair = (coin) => {
  const symbol = COIN_ID_TO_SYMBOL[coin.id];
  if (!symbol) return null;
  return {
    symbol,
    baseAsset: symbol.replace("USDT", ""),
    quoteAsset: "USDT",
    lastPrice: safeRound(coin.current_price, 4),
    change24h: safeRound(coin.price_change_percentage_24h || 0, 3),
    volumeQuote24h: safeRound(coin.total_volume || 0, 2),
    high24h: safeRound(coin.high_24h || coin.current_price, 4),
    low24h: safeRound(coin.low_24h || coin.current_price, 4),
  };
};

const fetchCoinGeckoPairs = async () => {
  const params = {
    vs_currency: "usd",
    ids: COIN_IDS.join(","),
    order: "market_cap_desc",
    sparkline: "false",
    price_change_percentage: "24h",
  };
  try {
    const { data } = await coingeckoAxios.get("/coins/markets", { params });
    return data.map(mapCoinToPair).filter(Boolean);
  } catch (error) {
    console.error("CoinGecko fallback error:", error.message);
    throw new Error("Live fallback feed unavailable.");
  }
};

const findFallbackPair = (pairs, symbol) =>
  pairs.find((pair) => pair.symbol === symbol) || pairs[0];

const buildFallbackSnapshot = (pairs, symbol) => {
  const selectedPair = findFallbackPair(pairs, symbol);
  const lastPrice = selectedPair?.lastPrice || 0;
  const symbolValue = selectedPair?.symbol || "BTCUSDT";
  const ticker = {
    symbol: symbolValue,
    lastPrice: lastPrice,
    high24h: selectedPair?.high24h || lastPrice,
    low24h: selectedPair?.low24h || lastPrice,
    change24h: selectedPair?.change24h || 0,
    volumeBase24h:
      lastPrice > 0 ? safeRound((selectedPair?.volumeQuote24h || 0) / lastPrice, 6) : 0,
    volumeQuote24h: selectedPair?.volumeQuote24h || 0,
    updatedAt: new Date().toISOString(),
  };

  return {
    symbol: symbolValue,
    ticker,
    pairs,
    orderBook: {
      bids: createBookSide(lastPrice, "bid"),
      asks: createBookSide(lastPrice, "ask"),
    },
    marketTrades: createFallbackTrades(symbolValue, lastPrice),
    myTrades: [],
    openOrders: [],
    wallets: [],
  };
};

export const fetchTradingPairs = () => apiRequest("/api/trades/pairs", { method: "GET" });

export const fetchPublicMarketState = (symbol) =>
  apiRequest("/api/trades/market-state", {
    method: "GET",
    params: { symbol },
  });

export const fetchMyMarketState = (symbol) =>
  apiRequest("/api/trades/my-market-state", {
    method: "GET",
    params: { symbol },
  });

export const placeSpotOrder = (payload) =>
  apiRequest("/api/trades/orders", {
    method: "POST",
    body: payload,
  }).catch((error) => {
    if (error?.status === 404) {
      return apiRequest("/api/trades", {
        method: "POST",
        body: payload,
      });
    }
    throw error;
  });

export const cancelSpotOrder = (id) =>
  apiRequest(`/api/trades/orders/${id}`, {
    method: "DELETE",
  }).catch((error) => {
    if (error?.status === 404) {
      return apiRequest(`/api/trades/${id}`, {
        method: "DELETE",
      });
    }
    throw error;
  });

export const checkTradeBackendAvailability = async () => {
  try {
    const response = await httpClient.get("/health");
    return Boolean(response?.data?.ok);
  } catch {
    return false;
  }
};

export const fetchFallbackMarketSnapshot = async (symbol) => {
  const pairs = await fetchCoinGeckoPairs();
  return buildFallbackSnapshot(pairs, symbol);
};

