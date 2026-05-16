import React from "react";

const OrderBook = ({ orderBook }) => {
  const { bids = [], asks = [] } = orderBook || {};
  const toLevel = (level) => {
    if (Array.isArray(level)) {
      const price = Number(level[0] || 0);
      const amount = Number(level[1] || 0);
      return {
        price,
        amount,
        total: price * amount,
      };
    }
    const price = Number(level?.price || 0);
    const amount = Number(level?.amount || 0);
    return {
      price,
      amount,
      total: Number(level?.total || price * amount),
    };
  };
  const hasDepth = asks.length > 0 || bids.length > 0;

  return (
    <div className="tx-panel tx-orderbook">
      <div className="tx-panel-title">Order Book</div>
      
      <div className="tx-book-head">
        <span>Price</span>
        <span>Amount</span>
        <span>Total</span>
      </div>

      <div className="tx-book-list tx-book-asks">
        {asks
          .slice(0, 15)
          .reverse()
          .map((ask, i) => {
            const level = toLevel(ask);
            return (
              <div key={`ask-${i}`} className="tx-book-row tx-book-sell">
                <span>{level.price.toLocaleString()}</span>
                <span>{level.amount.toLocaleString()}</span>
                <span>{level.total.toLocaleString()}</span>
              </div>
            );
          })}
      </div>

      <div className="tx-book-list tx-book-bids">
        {bids.slice(0, 15).map((bid, i) => {
          const level = toLevel(bid);
          return (
            <div key={`bid-${i}`} className="tx-book-row tx-book-buy">
              <span>{level.price.toLocaleString()}</span>
              <span>{level.amount.toLocaleString()}</span>
              <span>{level.total.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
      {!hasDepth && <p className="tx-empty mb-0 mt-2">No order book depth yet.</p>}
    </div>
  );
};

export default OrderBook;
