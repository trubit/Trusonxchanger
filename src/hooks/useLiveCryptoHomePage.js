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
  const marketCap = globalStatsQuery.data?.marketCap || "Loading...";
  const tradingVolume = globalStatsQuery.data?.tradingVolume || "Loading...";

  const price = parseFloat(ticker.current_price?.usd || 0).toFixed(2);
  const change24h = parseFloat(ticker.price_change_percentage_24h || 0).toFixed(2);
  const volume24h = parseFloat(ticker.total_volume?.usd || 0).toLocaleString();
  const high24h = parseFloat(ticker.high_24h?.usd || 0).toFixed(2);
  const low24h = parseFloat(ticker.low_24h?.usd || 0).toFixed(2);
  const isPositive = Number(change24h) > 0;

  return {
    ticker,
    setTicker: () => {},
    marketCap,
    setMarketCap: () => {},
    tradingVolume,
    setTradingVolume: () => {},
    exchangeTickers,
    setExchangeTickers: () => {},
    loading:
      mainCoinQuery.isLoading || topCoinsQuery.isLoading || globalStatsQuery.isLoading,
    setLoading: () => {},
    high24h,
    price,
    volume24h,
    low24h,
    change24h,
    isPositive,
  };
};

export default useLiveCryptoHomePage;
