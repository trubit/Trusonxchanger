import React from "react";
import { useAppContext } from "../common/AppContext";
import { formatPriceAmount } from "../../utils/currencyFormat";

const MarketTrades = ({ marketTrades = [] }) => {
  const { currency, rates } = useAppContext();

  return (
    <div className="tx-panel tx-market-trades">
      <div className="tx-panel-title">Market Trades</div>
      <div className="tx-trade-head">
        <span>{`Price (${currency})`}</span>
        <span>Amount</span>
        <span>Time</span>
      </div>
      <div className="tx-trades-list">
        {marketTrades.slice(0, 30).map((trade, i) => {
          const isBuy = trade.side === "buy";
          const tradeTime = trade.timestamp || trade.executedAt || trade.createdAt;
          return (
            <div key={`mtrade-${i}`} className="tx-trade-row">
              <span className={isBuy ? "tx-change-up" : "tx-change-down"}>
                {formatPriceAmount(trade.price, currency, rates)}
              </span>
              <span>{Number(trade.amount).toLocaleString()}</span>
              <span className="text-muted">
                {new Date(tradeTime).toLocaleTimeString([], {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        {marketTrades.length === 0 && (
          <p className="tx-empty">No recent trades.</p>
        )}
      </div>
    </div>
  );
};

export default MarketTrades;
