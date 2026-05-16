import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/api/auth";

// Signup state + validation + submit handler used by the Signup page.
const useSignup = () => {
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralId, setReferralId] = useState("");

  // UI states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-redirect after success
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage, navigate]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Email
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    // Password
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm Password
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  // Sends signup data to the backend when validation passes.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
    setIsSubmitting(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = await registerUser({
        email,
        password,
        referralId: referralId.trim() || undefined,
      });

      setSuccessMessage(
        payload.message || "Registration successful! Redirecting to login..."
      );
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setReferralId("");
    } catch (err) {
      setErrors({ general: err.message || "Registration failed" });
    } finally {
      setIsSubmitting(false);
    }
  };
  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    successMessage,
    isSubmitting,
    handleSubmit,
    errors,
    setErrors,
    referralId,
    setReferralId,
  };
};

export default useSignup;
