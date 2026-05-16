import MiniHeader from "../Components/layout/mini-header";
import { Spinner } from "react-bootstrap";
import TradeHeader from "../Components/trade/TradeHeader";
import TradingChart from "../Components/trade/TradingChart";
import OrderBook from "../Components/trade/OrderBook";
import TradeForm from "../Components/trade/TradeForm";
import MarketTrades from "../Components/trade/MarketTrades";
import TradingPairs from "../Components/trade/TradingPairs";
import TradeTabs from "../Components/trade/TradeTabs";
import { useTradeStore } from "../store/useTradeStore";
import { useTradeSocket } from "../hooks/useTradeSocket";
import { useTradeMarketStateQuery, useTradingPairsQuery } from "../hooks/queries/useTradeQueries";
import {
  useCancelSpotOrderMutation,
  usePlaceSpotOrderMutation,
} from "../hooks/mutations/useTradeMutations";
import "../styles/trade.css";

// TrusonXchanger live trading page.
const Trade = () => {
  const {
    activeSymbol,
    search,
    orderType,
    buyForm,
    sellForm,
    setSearch,
    setOrderType,
    setBuyField,
    setSellField,
    setActiveSymbol,
    resetOrderFields,
    error,
    setError,
    clearError,
  } = useTradeStore();

  const marketStateQuery = useTradeMarketStateQuery(activeSymbol);
  const pairsQuery = useTradingPairsQuery(marketStateQuery.backendAvailable);
  const placeOrderMutation = usePlaceSpotOrderMutation(activeSymbol);
  const cancelOrderMutation = useCancelSpotOrderMutation(activeSymbol);

  useTradeSocket({
    symbol: activeSymbol,
    isAuthenticated: marketStateQuery.isAuthenticated,
  });

  const snapshot = marketStateQuery.data || {};
  const pairs = snapshot?.pairs || pairsQuery.data || [];
  const ticker = snapshot?.ticker || {
    symbol: activeSymbol,
    lastPrice: 0,
    high24h: 0,
    low24h: 0,
    change24h: 0,
    volumeBase24h: 0,
    volumeQuote24h: 0,
  };
  const orderBook = snapshot?.orderBook || { bids: [], asks: [] };
  const marketTrades = snapshot?.marketTrades || [];
  const myTrades = snapshot?.myTrades || [];
  const openOrders = snapshot?.openOrders || [];
  const wallets = snapshot?.wallets || [];
  const loading = marketStateQuery.isLoading && !snapshot?.ticker;

  const handleSubmitOrder = async (side) => {
    const form = side === "buy" ? buyForm : sellForm;
    const payload = {
      symbol: activeSymbol,
      type: "spot",
      side,
      orderType,
      amount: Number(form.amount),
      price: Number(form.price || ticker.lastPrice),
    };

    try {
      clearError();
      await placeOrderMutation.mutateAsync(payload);
      resetOrderFields();
    } catch (submitError) {
      const message = submitError?.message || "Unable to place order.";
      setError(message);
      if (submitError?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.assign("/login");
      }
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      clearError();
      await cancelOrderMutation.mutateAsync(orderId);
    } catch (cancelError) {
      setError(cancelError?.message || "Unable to cancel order.");
    }
  };

  return (
    <>
      <MiniHeader showBreadcrumb={false} />
      <section className="tx-trade-page">
        <div className="tx-trade-shell">
          <TradeHeader ticker={ticker} />

          {loading ? (
            <div className="tx-panel p-4 text-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading market data...
            </div>
          ) : (
            <>
              <div className="tx-main-grid">
                <OrderBook orderBook={orderBook} />

                <div className="tx-center-stack">
                  <TradingChart symbol={activeSymbol} />
                  <TradeForm
                    symbol={activeSymbol}
                    orderType={orderType}
                    ticker={ticker}
                    setOrderType={setOrderType}
                    buyForm={buyForm}
                    sellForm={sellForm}
                    setBuyField={setBuyField}
                    setSellField={setSellField}
                    wallets={wallets}
                    onSubmitOrder={handleSubmitOrder}
                    submitting={placeOrderMutation.isPending}
                  />
                </div>

                <div className="d-flex flex-column gap-2">
                  <TradingPairs
                    pairs={pairs}
                    activeSymbol={activeSymbol}
                    search={search}
                    onSearch={setSearch}
                    onSelect={setActiveSymbol}
                  />
                  <MarketTrades
                    marketTrades={marketTrades}
                    myTrades={myTrades}
                  />
                </div>
              </div>

              <TradeTabs
                openOrders={openOrders}
                myTrades={myTrades}
                wallets={wallets}
                onCancelOrder={handleCancelOrder}
              />
            </>
          )}

          {error ? <div className="tx-error-banner">{error}</div> : null}
        </div>
      </section>
    </>
  );
};

export default Trade;
