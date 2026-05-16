import React from "react";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

const TradingChart = ({ symbol = "BTCUSDT" }) => {
  return (
    <div className="tx-panel tx-chart-panel">
      <AdvancedRealTimeChart
        theme="dark"
        symbol={symbol}
        autosize
        interval="D"
        timezone="Etc/UTC"
        style="1"
        locale="en"
        toolbar_bg="#f1f3f6"
        enable_publishing={false}
        hide_side_toolbar={false}
        allow_symbol_change={true}
        container_id="tradingview_chart"
      />
    </div>
  );
};

export default TradingChart;
