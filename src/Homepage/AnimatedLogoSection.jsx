import { Container, Row, Col } from "react-bootstrap";
import { ArrowRight } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import "../styles/AnimatedLogoSection.css";

const leftCards = [
  {
    title: "Cold Storage for Funds",
    description:
      "User funds are stored offline in cold wallets to reduce hacking and theft risks.",
  },
  {
    title: "End-to-End Encryption",
    description:
      "Sensitive user data is encrypted end-to-end throughout processing & storage.",
  },
  {
    title: "Secure API Connections",
    description:
      "Integrate API keys to safeguard credentials from unauthorized access.",
  },
];

const rightCards = [
  {
    title: "Insured Funds",
    description:
      "Assets are insured to guarantee security & offer a secure trading environment.",
  },
  {
    title: "24/7 Protection",
    description:
      "Follow DDoS protection, continuous monitoring, and other security protocols.",
  },
  {
    title: "Advanced Authentication",
    description:
      "2FA for secure account access through password and user verification.",
  },
];

const FeatureCard = ({ title, description }) => (
  <div className="als-card">
    <div className="als-card-title">{title}</div>
    <div className="als-card-desc">{description}</div>
  </div>
);

const AnimatedLogoSection = () => (
  <section className="als-section">
    <Container className="als-container">
      <div className="als-shell">
        <div className="als-header">
          <div className="als-label">
            UNMATCHED SECURITY FOR YOUR CRYPTO TRADES
          </div>
          <h2 className="als-heading">
            Powered With Top-Tier
            <br />
            Security Protocols
          </h2>
        </div>

        <Row className="align-items-center g-4">
          <Col xs={12} lg={3}>
            <div className="als-col">
              {leftCards.map((card, i) => (
                <FeatureCard key={i} {...card} />
              ))}
            </div>
          </Col>

          <Col xs={12} lg={6}>
            <div className="als-anim-wrap" aria-hidden="true">
              <div className="als-base-platform" />
              <div className="als-halo" />
              <div className="als-orbit-track als-orbit-track-1">
                <div className="als-satellite" />
              </div>
              <div className="als-orbit-track als-orbit-track-2">
                <div className="als-satellite" />
              </div>
              <div className="als-orbit-track als-orbit-track-3">
                <div className="als-satellite" />
              </div>
              <div className="als-ring-sphere als-sphere-outer" />
              <div className="als-ring-sphere als-sphere-mid" />
              <div className="als-ring-sphere als-sphere-inner" />
              <div className="als-t-container">
                <div className="als-t-halo-ring" />
                <div className="als-t-body">
                  <span className="als-t-text">T</span>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={12} lg={3}>
            <div className="als-col">
              {rightCards.map((card, i) => (
                <FeatureCard key={i} {...card} />
              ))}
            </div>
          </Col>
        </Row>

        <div className="als-cta-wrap">
          <Link className="als-cta" to="/signup">
            Get Started <ArrowRight className="als-cta-arrow" />
          </Link>
        </div>
      </div>
    </Container>
  </section>
);

export default AnimatedLogoSection;
