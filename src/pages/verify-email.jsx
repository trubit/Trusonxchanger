import { useMemo, useState } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/login.css";
import { resendEmailVerification, verifyEmail } from "../services/api/auth";

// Verify email page: accepts a 6-digit code and confirms the account.
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const initialCode = useMemo(
    () => searchParams.get("code") || "",
    [searchParams],
  );

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("idle");
  const [resendMessage, setResendMessage] = useState("");

  const handleVerify = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(code)) {
      setStatus("error");
      setMessage("Please enter the 6-digit verification code.");
      return;
    }

    setStatus("loading");
    try {
      await verifyEmail(code);
      setStatus("success");
      setMessage("Email verified successfully. You can now log in.");
    } catch (err) {
      setStatus("error");
      setMessage(
        err.message ||
          "Verification failed or code expired. You can request a new one below.",
      );
    }
  };

  const handleResend = async (event) => {
    event.preventDefault();
    setResendMessage("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setResendStatus("error");
      setResendMessage("Please enter a valid email address.");
      return;
    }

    setResendStatus("loading");
    try {
      await resendEmailVerification(email);
      setResendStatus("success");
      setResendMessage("Verification code sent. Check your inbox.");
    } catch (err) {
      setResendStatus("error");
      setResendMessage(
        err.message || "Unable to send verification code. Try again later.",
      );
    }
  };

  const showResendForm = status === "error" || status === "idle";

  return (
    <section className="tx-login-page">
      <div className="tx-login-bg" aria-hidden="true" />
      <main className="tx-login-main">
        <article className="tx-login-card" aria-labelledby="tx-verify-title">
          <header className="tx-login-head">
            <h1 id="tx-verify-title">Verify Code</h1>
            <p>
              Enter the 6-digit code we sent to your email to complete sign up.
            </p>
          </header>

          {status === "loading" && (
            <Alert variant="info" className="tx-login-alert">
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Verifying your email...
            </Alert>
          )}

          {status === "success" && (
            <Alert variant="success" className="tx-login-alert">
              {message}
            </Alert>
          )}

          {status === "error" && message && (
            <Alert variant="danger" className="tx-login-alert">
              {message}
            </Alert>
          )}

          {status !== "success" && (
            <Form onSubmit={handleVerify} noValidate>
              <Form.Group className="tx-login-group" controlId="tx-verify-code">
                <Form.Label>Verification Code</Form.Label>
                <Form.Control
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
                  disabled={status === "loading"}
                />
              </Form.Group>

              <Button
                type="submit"
                className="tx-login-submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Verifying...
                  </>
                ) : (
                  "Verify code"
                )}
              </Button>
            </Form>
          )}

          {showResendForm && (
            <>
              <div className="tx-login-divider" role="presentation">
                <span>resend verification code</span>
              </div>

              <Form onSubmit={handleResend} noValidate>
                <Form.Group className="tx-login-group" controlId="tx-verify-email">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={resendStatus === "loading"}
                  />
                </Form.Group>

                {resendMessage && (
                  <Alert
                    variant={resendStatus === "success" ? "success" : "danger"}
                    className="tx-login-alert"
                  >
                    {resendMessage}
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="tx-login-submit"
                  disabled={resendStatus === "loading"}
                >
                  {resendStatus === "loading" ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Sending...
                    </>
                  ) : (
                    "Resend verification code"
                  )}
                </Button>
              </Form>
            </>
          )}

          {status === "success" && (
            <p className="tx-login-footer">
              Ready to continue? <Link to="/login">Log in</Link>
            </p>
          )}
        </article>
      </main>
    </section>
  );
};

export default VerifyEmail;
