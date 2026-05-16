import { useState } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import ToggleTheme from "../Components/common/toggleTheme";
import AuthBranding from "../Components/auth/authBranding";
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
                <h3 className="text-center fw-bold mb-2">Forgot Password</h3>
                <p className="text-center mb-4 mb-md-5">
                  Enter your email and we&apos;ll send a reset link.
                </p>

                {error && (
                  <Alert variant="danger" dismissible>
                    {error}
                  </Alert>
                )}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      size="md"
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="form-control-email"
                    />
                  </Form.Group>

                  <Button
                    variant="success"
                    size="lg"
                    className="w-100 fw-bold button-form"
                    type="submit"
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

                  <div className="text-center mt-4 small">
                    Remembered your password? &nbsp;&nbsp;
                    <Link
                      to="/login"
                      className="text-success fw-medium text-decoration-none"
                    >
                      Login
                    </Link>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
