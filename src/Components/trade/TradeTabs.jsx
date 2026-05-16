import React, { useState } from "react";

const TradeTabs = ({ openOrders = [], myTrades = [], wallets = [], onCancelOrder }) => {
  const [activeTab, setActiveTab] = useState("open");

  return (
    <div className="tx-panel tx-tabs-panel">
      <div className="tx-bottom-tabs">
        <button
          className={activeTab === "open" ? "active" : ""}
          onClick={() => setActiveTab("open")}
        >
          Open Orders ({openOrders.length})
        </button>
        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          Trade History
        </button>
        <button
          className={activeTab === "wallets" ? "active" : ""}
          onClick={() => setActiveTab("wallets")}
        >
          Wallets
        </button>
      </div>

      <div className="tx-tab-content">
        {activeTab === "open" && (
          <div className="tx-orders-table">
            <div className="tx-orders-head">
              <span>Date</span>
              <span>Pair</span>
              <span>Side</span>
              <span>Price</span>
              <span>Amount</span>
              <span>Filled</span>
              <span>Action</span>
            </div>
            {openOrders.map((order) => (
              <div key={order._id} className="tx-orders-row">
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span>{order.symbol}</span>
                <span className={order.side === "buy" ? "tx-change-up" : "tx-change-down"}>
                  {order.side.toUpperCase()}
                </span>
                <span>{order.price.toLocaleString()}</span>
                <span>{order.amount.toLocaleString()}</span>
                <span>{((order.filledAmount / order.amount) * 100).toFixed(1)}%</span>
                <span>
                  <button
                    className="tx-cancel-btn"
                    onClick={() => onCancelOrder(order._id)}
                  >
                    Cancel
                  </button>
                </span>
              </div>
            ))}
            {openOrders.length === 0 && <p className="tx-empty">No open orders.</p>}
          </div>
        )}

        {activeTab === "history" && (
          <div className="tx-orders-table">
            <div className="tx-orders-head">
              <span>Date</span>
              <span>Pair</span>
              <span>Side</span>
              <span>Price</span>
              <span>Amount</span>
              <span>Total</span>
              <span>Status</span>
            </div>
            {myTrades.map((trade, i) => (
              <div key={i} className="tx-orders-row">
                <span>{new Date(trade.executedAt || trade.createdAt).toLocaleDateString()}</span>
                <span>{trade.symbol}</span>
                <span className={trade.side === "buy" ? "tx-change-up" : "tx-change-down"}>
                  {trade.side.toUpperCase()}
                </span>
                <span>{trade.price.toLocaleString()}</span>
                <span>{trade.amount.toLocaleString()}</span>
                <span>{(trade.price * trade.amount).toLocaleString()}</span>
                <span className="text-muted">Completed</span>
              </div>
            ))}
            {myTrades.length === 0 && <p className="tx-empty">No trade history.</p>}
          </div>
        )}

        {activeTab === "wallets" && (
          <div className="p-3">
            <div className="row g-3">
              {wallets.map((wallet) => (
                <div key={wallet.coin} className="col-md-3">
                  <div className="p-3 border rounded bg-dark">
                    <div className="text-muted small mb-1">{wallet.coin}</div>
                    <div className="h5 mb-0">{wallet.balance.toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {wallets.length === 0 && <p className="tx-empty">No wallet data.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeTabs;
