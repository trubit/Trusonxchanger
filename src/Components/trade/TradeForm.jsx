import React from "react";
import { useTradeStore } from "../../store/useTradeStore";

const TradeForm = ({
  symbol,
  orderType,
  ticker,
  setOrderType,
  buyForm,
  sellForm,
  setBuyField,
  setSellField,
  wallets,
  onSubmitOrder,
  submitting,
}) => {
  const setError = useTradeStore((state) => state.setError);

  const [base] = symbol.split(/USDT|ETH|BTC/); // Rough split for UI
  const quoteSymbol = symbol.endsWith("USDT") ? "USDT" : symbol.slice(-3);

  const handleOrderClick = (side) => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) {
      window.location.assign("/login");
      return;
    }

    const form = side === "buy" ? buyForm : sellForm;
    const amount = Number(form.amount);
    const enteredPrice = Number(form.price);
    const livePrice = Number(ticker?.lastPrice || 0);
    const effectivePrice =
      orderType === "limit"
        ? enteredPrice
        : Number.isFinite(livePrice) && livePrice > 0
          ? livePrice
          : enteredPrice;

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid order amount.");
      return;
    }

    if (orderType === "limit" && (!Number.isFinite(enteredPrice) || enteredPrice <= 0)) {
      setError("Enter a valid limit price.");
      return;
    }

    if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) {
      setError("Market price is unavailable. Try again shortly.");
      return;
    }

    if (side === "buy") {
      const availableQuote = Number(getBalance(quoteSymbol) || 0);
      const requiredQuote = amount * effectivePrice;
      if (requiredQuote > availableQuote) {
        setError(`Insufficient ${quoteSymbol} balance.`);
        return;
      }
    } else {
      const baseSymbol = base || symbol;
      const availableBase = Number(getBalance(baseSymbol) || 0);
      if (amount > availableBase) {
        setError(`Insufficient ${baseSymbol} balance.`);
        return;
      }
    }

    setError("");
    onSubmitOrder(side);
  };

  const getBalance = (sym) => {
    const w = wallets.find((wf) => wf.asset === sym);
    return w ? w.balance : 0;
  };

  return (
    <div className="tx-panel tx-form-panel">
      <div className="tx-order-type">
        <button
          type="button"
          className={orderType === "limit" ? "active" : ""}
          onClick={() => setOrderType("limit")}
        >
          Limit
        </button>
        <button
          type="button"
          className={orderType === "market" ? "active" : ""}
          onClick={() => setOrderType("market")}
        >
          Market
        </button>
      </div>

      <div className="tx-form-grid">
        {/* Buy Side */}
        <div className="tx-form-side">
          <div className="tx-form-head">
            <h4 className="tx-buy">Buy {base || symbol}</h4>
            <span>Bal: {getBalance(quoteSymbol).toLocaleString()} {quoteSymbol}</span>
          </div>

          {orderType === "limit" && (
            <div className="tx-field-wrap">
              <label>Price</label>
              <div className="tx-field-inline">
                <input
                  type="number"
                  className="tx-input"
                  value={buyForm.price}
                  onChange={(e) => setBuyField("price", e.target.value)}
                  placeholder="0.00"
                />
                <span>{quoteSymbol}</span>
              </div>
            </div>
          )}

          <div className="tx-field-wrap">
            <label>Amount</label>
            <div className="tx-field-inline">
              <input
                type="number"
                className="tx-input"
                value={buyForm.amount}
                onChange={(e) => setBuyField("amount", e.target.value)}
                placeholder="0.00"
              />
              <span>{base || symbol}</span>
            </div>
          </div>

          <button
            type="button"
            className="tx-submit tx-buy mt-3"
            onClick={() => handleOrderClick("buy")}
            disabled={submitting}
          >
            {submitting ? "Processing..." : `Buy ${base || symbol}`}
          </button>
        </div>

        {/* Sell Side */}
        <div className="tx-form-side">
          <div className="tx-form-head">
            <h4 className="tx-sell">Sell {base || symbol}</h4>
            <span>Bal: {getBalance(base || symbol).toLocaleString()} {base || symbol}</span>
          </div>

          {orderType === "limit" && (
            <div className="tx-field-wrap">
              <label>Price</label>
              <div className="tx-field-inline">
                <input
                  type="number"
                  className="tx-input"
                  value={sellForm.price}
                  onChange={(e) => setSellField("price", e.target.value)}
                  placeholder="0.00"
                />
                <span>{quoteSymbol}</span>
              </div>
            </div>
          )}

          <div className="tx-field-wrap">
            <label>Amount</label>
            <div className="tx-field-inline">
              <input
                type="number"
                className="tx-input"
                value={sellForm.amount}
                onChange={(e) => setSellField("amount", e.target.value)}
                placeholder="0.00"
              />
              <span>{base || symbol}</span>
            </div>
          </div>

          <button
            type="button"
            className="tx-submit tx-sell mt-3"
            onClick={() => handleOrderClick("sell")}
            disabled={submitting}
          >
            {submitting ? "Processing..." : `Sell ${base || symbol}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeForm;
