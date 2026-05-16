import { useMemo, useState } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import ToggleTheme from "../Components/common/toggleTheme";
import AuthBranding from "../Components/auth/authBranding";
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
    <div className="position-relative min-vh-100">
      <ToggleTheme />
      <div className="container d-flex flex-column flex-lg-row gap-5 align-items-lg-start justify-content-center">
        <AuthBranding />

        <div className="d-flex align-items-center justify-content-center p-3 main-login-background">
          <div className="login-background">
            <Card
              className="border-0 shadow-xl overflow-hidden"
              id="form-login"
            >
              <Card.Body className="p-4 p-md-5">
                <h3 className="text-center fw-bold mb-2">Verify Code</h3>
                <p className="text-center mb-4 mb-md-5">
                  Enter the 6-digit code we sent to your email to complete sign up.
                </p>

                {status === "loading" && (
                  <Alert variant="info">
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2"
                    />
                    Verifying your email...
                  </Alert>
                )}

                {status === "success" && (
                  <Alert variant="success">{message}</Alert>
                )}

                {status === "error" && message && (
                  <Alert variant="danger">{message}</Alert>
                )}

                {status !== "success" && (
                  <Form onSubmit={handleVerify}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">
                        Verification code
                      </Form.Label>
                      <Form.Control
                        type="text"
                        inputMode="numeric"
                        placeholder="6-digit code"
                        value={code}
                        size="md"
                        onChange={(e) =>
                          setCode(e.target.value.replace(/\s/g, ""))
                        }
                        disabled={status === "loading"}
                        className="form-control-email"
                      />
                    </Form.Group>

                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100 fw-bold button-form mb-3"
                      type="submit"
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Verifying...
                        </>
                      ) : (
                        "Verify code"
                      )}
                    </Button>
                  </Form>
                )}

                {showResendForm && (
                  <Form onSubmit={handleResend}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">
                        Email address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        size="md"
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={resendStatus === "loading"}
                        className="form-control-email"
                      />
                    </Form.Group>

                    {resendMessage && (
                      <Alert
                        variant={
                          resendStatus === "success" ? "success" : "danger"
                        }
                      >
                        {resendMessage}
                      </Alert>
                    )}

                    <Button
                      variant="success"
                      size="lg"
                      className="w-100 fw-bold button-form"
                      type="submit"
                      disabled={resendStatus === "loading"}
                    >
                      {resendStatus === "loading" ? (
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
                        "Resend verification code"
                      )}
                    </Button>
                  </Form>
                )}

                {status === "success" && (
                  <div className="text-center mt-4 small">
                    Ready to continue? &nbsp;&nbsp;
                    <Link
                      to="/login"
                      className="text-success fw-medium text-decoration-none"
                    >
                      Log in
                    </Link>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
