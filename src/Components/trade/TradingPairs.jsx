import React from "react";

const TradingPairs = ({
  pairs = [],
  activeSymbol,
  search,
  onSearch,
  onSelect,
}) => {
  const filteredPairs = pairs.filter((p) =>
    p.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tx-panel tx-pairs-panel">
      <div className="tx-panel-title">Markets</div>
      <div className="tx-pairs-search">
        <input
          type="text"
          className="tx-input py-1"
          placeholder="Search coin..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="tx-pairs-head">
        <span>Pair</span>
        <span>Price</span>
        <span>Change</span>
      </div>
      <div className="tx-pairs-list">
        {filteredPairs.map((pair) => {
          const isUp = pair.change24h >= 0;
          return (
            <button
              key={pair.symbol}
              className={`tx-pair-row ${pair.symbol === activeSymbol ? "active" : ""}`}
              onClick={() => onSelect(pair.symbol)}
            >
              <span className="fw-bold">{pair.symbol}</span>
              <span>{Number(pair.lastPrice).toLocaleString()}</span>
              <span className={isUp ? "tx-change-up" : "tx-change-down"}>
                {isUp ? "+" : ""}{pair.change24h}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TradingPairs;
