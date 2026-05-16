import { Card, Col, Container, Row } from "react-bootstrap";
import visionIcon from "../../assets/vision.png";
import missionIcon from "../../assets/mission.png";

const VisionMissionSection = () => {
  return (
    <section className="vision-mission">
      <Container fluid="xxl" className="vision-mission__container">
        <Row className="g-4 vision-mission__row">
          <Col md={6}>
            <Card className="vision-mission__card h-100">
              <Card.Body>
                <img
                  src={visionIcon}
                  alt="Vision icon"
                  className="vision-mission__icon"
                />
                <h2 className="vision-mission__title">Our Vision</h2>
                <p className="vision-mission__text">
                  To be a trusted catalyst in the global shift toward
                  decentralized finance by empowering individuals and businesses
                  with secure, transparent, and intuitive access to digital
                  assets. We envision a future where financial inclusion and
                  innovation go hand in hand—breaking barriers through
                  technology and trust.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="vision-mission__card h-100">
              <Card.Body>
                <img
                  src={missionIcon}
                  alt="Mission icon"
                  className="vision-mission__icon"
                />
                <h2 className="vision-mission__title">Our Mission</h2>
                <p className="vision-mission__text">
                  To simplify crypto trading for everyone, from first-time users
                  to experienced traders.
                </p>
                <p className="vision-mission__text">
                  To uphold security and compliance by integrating industry
                  leaders like Fireblocks and Veriff.
                </p>
                <p className="vision-mission__text">
                  To support real-world utility by enabling fast, seamless, and
                  secure transactions.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default VisionMissionSection;
