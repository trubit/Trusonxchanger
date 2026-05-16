import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import "../../styles/NewsletterSection.css";
import mailImage from "../../assets/email.png";
import { useNewsletterMutation } from "../../hooks/mutations/useNewsletterMutation";

const NewsletterSection = () => {
  const subscribeMutation = useNewsletterMutation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Please enter your email.");
      return;
    }

    setStatus("loading");
    try {
      const data = await subscribeMutation.mutateAsync(trimmed);
      if (data?.success) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Network error. Please try again later.");
    }
  };

  return (
    <section className="nl-section">
      <Container className="nl-container">
        <div className="nl-shell">
          <Row className="align-items-center g-4">
            <Col xs={12} lg={7}>
              <div className="nl-content">
                <div className="nl-label">Newsletter</div>
                <h2 className="nl-heading">
                  Subscribe to Our
                  <br />
                  Newsletter
                </h2>
                <p className="nl-subtext">
                  Get The Latest Updates On Digital Currency Trading!
                </p>
                <form className="nl-form" onSubmit={handleSubmit} noValidate>
                  <input
                    className="nl-input"
                    type="email"
                    placeholder="Enter Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    aria-label="Enter Your Email"
                  />
                  <button
                    className="nl-btn"
                    type="submit"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "Subscribing..." : "Subscribe"}
                  </button>
                </form>
                {status !== "idle" && status !== "loading" && (
                  <p
                    className={`nl-feedback ${
                      status === "success" ? "nl-success" : "nl-error"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </div>
            </Col>
            <Col xs={12} lg={5}>
              <div className="nl-image-wrap">
                <img
                  className="nl-image"
                  src={mailImage}
                  alt="Newsletter"
                  draggable="false"
                />
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
};

export default NewsletterSection;
