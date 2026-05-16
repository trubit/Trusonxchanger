import { Container, Row, Col } from "react-bootstrap";
import "../../styles/ExchangesSection.css";

import binanceLogo from "../../assets/binance-logo.png";
import coinbaseLogo from "../../assets/coinbase-coin-logo.png";
import krakenLogo from "../../assets/kraken-logo.png";
import bitfinexLogo from "../../assets/bitfinex-logo.png";
import bitstampLogo from "../../assets/bitstamp-logo.png";
import kucoinLogo from "../../assets/kucoin-logo.png";
import okxLogo from "../../assets/okx-logo.png";
import bybitLogo from "../../assets/bybit-logo.png";
import gateioLogo from "../../assets/gate-io-icon-logo.png";
import huobiLogo from "../../assets/huobi-logo.png";
import mexcLogo from "../../assets/mexc-logo.png";
import poloniexLogo from "../../assets/poloniex-logo.png";

const exchanges = [
  { name: "Binance", logo: binanceLogo },
  { name: "Coinbase", logo: coinbaseLogo },
  { name: "Kraken", logo: krakenLogo },
  { name: "Bitfinex", logo: bitfinexLogo },
  { name: "Bitstamp", logo: bitstampLogo },
  { name: "KuCoin", logo: kucoinLogo },
  { name: "OKX", logo: okxLogo },
  { name: "Bybit", logo: bybitLogo },
  { name: "Gate.io", logo: gateioLogo },
  { name: "Huobi", logo: huobiLogo },
  { name: "MEXC", logo: mexcLogo },
  { name: "Poloniex", logo: poloniexLogo },
];

const ExchangesSection = () => {
  const duplicated = [...exchanges, ...exchanges];
  return (
    <section className="exchanges-section-bg">
      <Container fluid="xxl">
        <div className="exchanges-shell">
          <Row className="align-items-center flex-column flex-md-row g-4 g-lg-5">
            <Col md={7}>
              <p className="exchanges-kicker">INTEGRATED MARKET ACCESS</p>
              <h2 className="exchanges-title">Exchanges Integrated</h2>
              <p className="exchanges-subtitle">
                Route opportunities across top-tier venues with deep liquidity,
                better execution, and consistent uptime.
              </p>
              <div className="exchanges-slider-outer">
                <div className="exchanges-slider-track">
                  {duplicated.map((ex, idx) => (
                    <div className="exchange-item" key={idx}>
                      <img
                        src={ex.logo}
                        alt={ex.name}
                        className="exchange-logo"
                        draggable="false"
                      />
                      <span className="exchange-name">{ex.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
            <Col md={5}>
              <div className="metrics-row">
                <div className="metric-block text-center">
                  <div className="metric-number">1,000+</div>
                  <div className="metric-label">Market Pairs</div>
                </div>
                <div className="metric-block text-center">
                  <div className="metric-number">2,000+</div>
                  <div className="metric-label">Cryptocurrencies</div>
                </div>
                <div className="metric-block text-center">
                  <div className="metric-number">30+</div>
                  <div className="metric-label">Exchanges</div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
};

export default ExchangesSection;
