import { coingeckoAxios } from "./api/axiosInstance";

const MAIN_COIN = "solana";
const MARKET_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "ripple",
  "cardano",
  "dogecoin",
  "polkadot",
  "chainlink",
  "litecoin",
  "avalanche-2",
  "polygon",
  "shiba-inu",
  "tron",
  "bitcoin-cash",
  "uniswap",
  "cosmos",
  "stellar",
  "near",
  "ethereum-classic",
  "filecoin",
];

export const marketService = {
  getMainCoin: () =>
    coingeckoAxios.get(
      `/coins/${MAIN_COIN}?localization=false&tickers=false&market_data=true`,
    ),
  getMarketCoins: () =>
    coingeckoAxios.get(
      `/coins/markets?vs_currency=usd&ids=${MARKET_IDS.join(",")}&order=market_cap_desc`,
    ),
  getGlobalStats: () => coingeckoAxios.get("/global"),
};
