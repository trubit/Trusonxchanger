import { Badge, Col, Row, Spinner, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { EmptyState } from "./DashShared";
import { fmtCrypto, fmtDate, fmtUsd } from "./dashUtils";

const DashActivity = ({ isLoading, trades, transactions }) => (
  <Row className="g-4">

    {/* Recent Trades */}
    <Col xs={12} lg={7}>
      <div className="dash-section">
        <div className="dash-section-head">
          <span className="dash-section-title">Recent Trades</span>
          <Link to="/Dashboard/trade" className="dash-section-link">View all →</Link>
        </div>

        {isLoading ? (
          <div className="py-3 text-center">
            <Spinner animation="border" size="sm" style={{ color: "#f0b90b" }} />
          </div>
        ) : trades.length === 0 ? (
          <EmptyState icon="graph-up" text="No trades yet. Place your first order to get started." />
        ) : (
          <div className="dash-table-wrap">
            <Table className="dash-table" size="sm">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Side</th>
                  <th>Amount</th>
                  <th>Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t._id}>
                    <td className="dash-td-pair">{t.symbol}</td>
                    <td>
                      <span className={`dash-side-badge dash-side-${t.side}`}>
                        {t.side?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCrypto(t.amount, 4)}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmtUsd(t.price)}</td>
                    <td className="dash-td-date">{fmtDate(t.executedAt || t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </Col>

    {/* Recent Transactions */}
    <Col xs={12} lg={5}>
      <div className="dash-section">
        <div className="dash-section-head">
          <span className="dash-section-title">Recent Transactions</span>
        </div>

        {isLoading ? (
          <div className="py-3 text-center">
            <Spinner animation="border" size="sm" style={{ color: "#f0b90b" }} />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState icon="clock-history" text="No transaction history yet." />
        ) : (
          <div className="dash-tx-list">
            {transactions.map((tx) => (
              <div key={tx._id} className="dash-tx-item">
                <div className={`dash-tx-icon dash-tx-icon--${tx.type}`}>
                  <i className={`bi bi-arrow-${tx.type === "deposit" ? "down" : "up"}-circle-fill`} />
                </div>
                <div className="dash-tx-info">
                  <span className="dash-tx-type">
                    {tx.type ? tx.type.charAt(0).toUpperCase() + tx.type.slice(1) : "—"}
                  </span>
                  <span className="dash-tx-date">{fmtDate(tx.createdAt)}</span>
                </div>
                <div className="dash-tx-right">
                  <span className={`dash-tx-amount dash-tx-amount--${tx.type}`}>
                    {tx.type === "deposit" ? "+" : "−"}
                    {fmtCrypto(tx.amount, 4)} {tx.asset}
                  </span>
                  <Badge
                    bg={tx.status === "completed" ? "success" : tx.status === "pending" ? "warning" : "danger"}
                    className="dash-tx-status-badge"
                  >
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Col>

  </Row>
);

export default DashActivity;
