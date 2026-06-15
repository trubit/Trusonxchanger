import { useEffect, useState } from "react";
import { Form, Button, Alert, Spinner, InputGroup } from "react-bootstrap";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import "../styles/login.css";
import { resetPassword } from "../services/api/auth";

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const ResetPassword = () => {
  // Token is included in the reset link email as a query param.
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!success) {
      return;
    }
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [navigate, success]);

  // Step 2: submit the new password with the token.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing reset token. Please use the link sent to your email.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      setError(
        "Password must be at least 8 characters and include upper/lower case letters, a number, and a symbol.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token, password });
      setSuccess("Password reset! Redirecting to login...");
    } catch (err) {
      setError(err.message || "Unable to reset password. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="tx-login-page">
      <div className="tx-login-bg" aria-hidden="true" />
      <main className="tx-login-main">
        <article className="tx-login-card" aria-labelledby="tx-reset-title">
          <header className="tx-login-head">
            <h1 id="tx-reset-title">Reset Password</h1>
            <p>Enter a new password below to reclaim access.</p>
          </header>

          {error && <Alert variant="danger" className="tx-login-alert">{error}</Alert>}
          {success && <Alert variant="success" className="tx-login-alert">{success}</Alert>}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="tx-login-group" controlId="tx-reset-password">
              <Form.Label>New Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="tx-login-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeSlash size={17} /> : <Eye size={17} />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="tx-login-group" controlId="tx-reset-confirm-password">
              <Form.Label>Confirm New Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="tx-login-password-toggle"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeSlash size={17} /> : <Eye size={17} />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Button
              type="submit"
              className="tx-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </Form>

          <p className="tx-login-footer">
            Need another link?{" "}
            <Link to="/forgot-password">Request reset email</Link>
          </p>
        </article>
      </main>
    </section>
  );
};

export default ResetPassword;
