import { useEffect, useState } from "react";
import { Card, Form, Button, Alert, Spinner, InputGroup } from "react-bootstrap";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import ToggleTheme from "../Components/common/toggleTheme";
import AuthBranding from "../Components/auth/authBranding";
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
    <div className="position-relative min-vh-100">
      <ToggleTheme />
      <div className="container d-flex flex-column flex-lg-row gap-5 align-items-lg-start justify-content-center">
        <AuthBranding />

        <div className="d-flex align-items-center justify-content-center p-3 main-login-background">
          <div className="login-background">
            <Card className="border-0 shadow-xl overflow-hidden" id="form-login">
              <Card.Body className="p-4 p-md-5">
                <h3 className="text-center fw-bold mb-2">Reset Password</h3>
                <p className="text-center mb-4 mb-md-5">
                  Enter a new password below to reclaim access.
                </p>

                {error && (
                  <Alert variant="danger" dismissible>
                    {error}
                  </Alert>
                )}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">New password</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="form-control-email"
                      />
                      <InputGroup.Text
                        className="input-group-text"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">
                      Confirm new password
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="form-control-email"
                      />
                      <InputGroup.Text
                        className="input-group-text"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? (
                          <EyeSlash size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>

                  <Button
                    variant="success"
                    size="lg"
                    className="w-100 fw-bold button-form"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Resetting...
                      </>
                    ) : (
                      "Reset password"
                    )}
                  </Button>

                  <div className="text-center mt-4 small">
                    Need another link? &nbsp;
                    <Link
                      to="/forgot-password"
                      className="text-success fw-medium text-decoration-none"
                    >
                      Request a new reset email
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

export default ResetPassword;
