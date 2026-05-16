import { coingeckoAxios } from "./axiosInstance";

// Fetch selected coin details for the homepage.
export const getCoinsData = (MAIN_COIN) => {
  return coingeckoAxios.get(
    `/coins/${MAIN_COIN}?localization=false&tickers=false&market_data=true`,
  );
};

// Fetch a list of coins by ids.
export const getCoinsList = (COINS) => {
  return coingeckoAxios.get(
    `/coins/markets?vs_currency=usd&ids=${COINS.join(",")}&order=market_cap_desc`,
  );
};

// Fetch overall market stats.
export const getGlobalStats = () => {
  return coingeckoAxios.get("/global");
};
