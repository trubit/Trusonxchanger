import { useState } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../styles/login.css";
import { requestPasswordReset } from "../services/api/auth";

// Page where users request a reset link via email.
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: request a reset link for the email address.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess("Password reset link sent! Check your inbox.");
    } catch (err) {
      setError(err.message || "Unable to send reset link. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="tx-login-page">
      <div className="tx-login-bg" aria-hidden="true" />
      <main className="tx-login-main">
        <article className="tx-login-card" aria-labelledby="tx-forgot-title">
          <header className="tx-login-head">
            <h1 id="tx-forgot-title">Forgot Password</h1>
            <p>Enter your email and we&apos;ll send a reset link.</p>
          </header>

          {error && <Alert variant="danger" className="tx-login-alert">{error}</Alert>}
          {success && <Alert variant="success" className="tx-login-alert">{success}</Alert>}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="tx-login-group" controlId="tx-forgot-email">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </Form.Group>

            <Button
              type="submit"
              className="tx-login-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </Form>

          <p className="tx-login-footer">
            Remembered your password? <Link to="/login">Sign in</Link>
          </p>
        </article>
      </main>
    </section>
  );
};

export default ForgotPassword;
