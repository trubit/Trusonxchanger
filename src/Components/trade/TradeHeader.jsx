import React from "react";
import { useAppContext } from "../common/AppContext";
import {
  formatCompactCurrencyAmount,
  formatPriceAmount,
} from "../../utils/currencyFormat";

const TradeHeader = ({ ticker }) => {
  const { currency, rates } = useAppContext();
  const isUp = ticker.change24h >= 0;

  return (
    <div className="tx-trade-header d-flex align-items-center gap-4 flex-wrap">
      <div className="tx-trade-header-symbol">
        <h2 className="mb-0">{ticker.symbol}</h2>
        <p className="mb-0 text-muted" style={{ fontSize: "0.75rem" }}>
          Spot Trading
        </p>
      </div>

      <div className="d-flex flex-column">
        <strong className={`tx-last-price ${isUp ? "tx-change-up" : "tx-change-down"}`}>
          {formatPriceAmount(ticker.lastPrice, currency, rates)}
        </strong>
        <p className="mb-0">Last Price</p>
      </div>

      <div className="d-flex flex-column">
        <span className={`tx-change ${isUp ? "tx-change-up" : "tx-change-down"}`}>
          {isUp ? "+" : ""}{ticker.change24h}%
        </span>
        <p className="mb-0">24h Change</p>
      </div>

      <div className="d-flex flex-column">
        <strong>{formatPriceAmount(ticker.high24h, currency, rates)}</strong>
        <p className="mb-0">24h High</p>
      </div>

      <div className="d-flex flex-column">
        <strong>{formatPriceAmount(ticker.low24h, currency, rates)}</strong>
        <p className="mb-0">24h Low</p>
      </div>

      <div className="d-flex flex-column">
        <strong>
          {formatCompactCurrencyAmount(ticker.volumeQuote24h, currency, rates)}
        </strong>
        <p className="mb-0">{`24h Volume (${currency})`}</p>
      </div>
    </div>
  );
};

export default TradeHeader;
