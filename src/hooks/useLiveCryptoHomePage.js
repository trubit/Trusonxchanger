import {
  useGlobalStatsQuery,
  useMainCoinQuery,
  useTopCoinsQuery,
} from "./queries/useMarketQueries";

const useLiveCryptoHomePage = () => {
  const mainCoinQuery = useMainCoinQuery();
  const topCoinsQuery = useTopCoinsQuery();
  const globalStatsQuery = useGlobalStatsQuery();

  const ticker = mainCoinQuery.data || {};
  const exchangeTickers = topCoinsQuery.data || [];
  const marketCapUsd = Number(globalStatsQuery.data?.marketCapUsd || 0);
  const tradingVolumeUsd = Number(globalStatsQuery.data?.tradingVolumeUsd || 0);

  const priceUsd = Number(ticker.current_price?.usd || 0);
  const change24h = Number(ticker.price_change_percentage_24h || 0);
  const volume24hUsd = Number(ticker.total_volume?.usd || 0);
  const high24hUsd = Number(ticker.high_24h?.usd || 0);
  const low24hUsd = Number(ticker.low_24h?.usd || 0);
  const isPositive = change24h > 0;

  return {
    ticker,
    setTicker: () => {},
    marketCapUsd,
    setMarketCap: () => {},
    tradingVolumeUsd,
    setTradingVolume: () => {},
    exchangeTickers,
    setExchangeTickers: () => {},
    loading:
      mainCoinQuery.isLoading || topCoinsQuery.isLoading || globalStatsQuery.isLoading,
    setLoading: () => {},
    high24hUsd,
    priceUsd,
    volume24hUsd,
    low24hUsd,
    change24h,
    isPositive,
  };
};

export default useLiveCryptoHomePage;
