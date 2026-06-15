import { useMemo } from "react";
import { useTrusonCoinQuery } from "../../hooks/queries/useMarketQueries";
import { useAppContext } from "./AppContext";
import {
  formatCompactCurrencyAmount,
  formatPriceAmount,
} from "../../utils/currencyFormat";

// Live row for TrusonCoin (from backend catalog).
const TrusonCoins = () => {
  const { data: coin, error } = useTrusonCoinQuery();
  const { currency, rates } = useAppContext();

  const formatted = useMemo(() => {
    if (!coin) return null;
    const price = Number(coin.priceUsd || 0);
    const change24h = Number(coin.change24h || 0);
    const volume24h = Number(coin.volume24h || 0);
    return { price, change24h, volume24h, isPositive: change24h > 0 };
  }, [coin]);

  if (error) {
    return (
      <tr>
        <td colSpan={4} className="text-danger">
          {error.message || "Unable to load TrusonCoin."}
        </td>
      </tr>
    );
  }

  if (!formatted) {
    return (
      <tr>
        <td>TRUSON</td>
        <td>Loading...</td>
        <td>--</td>
        <td>--</td>
      </tr>
    );
  }

  return (
    <tr>
      <td>TRUSON</td>
      <td>{formatPriceAmount(formatted.price, currency, rates)}</td>
      <td className={formatted.isPositive ? "text-success" : "text-danger"}>
        {formatted.change24h > 0 ? "+" : ""}
        {formatted.change24h.toFixed(2)}%
      </td>
      <td>{formatCompactCurrencyAmount(formatted.volume24h, currency, rates)}</td>
    </tr>
  );
};

export default TrusonCoins;
