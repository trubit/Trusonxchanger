import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const REMEMBER_EMAIL_KEY = "tx_remember_email";

const readRememberedEmail = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
};

const useLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(readRememberedEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const navigate = useNavigate();
  const storeLogin = useAuthStore((s) => s.login);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setNeedsVerification(false);
    setIsLoading(true);

    try {
      await storeLogin({ email, password });
      setSuccess("Login successful!");
      navigate("/Dashboard");
    } catch (err) {
      const message = err.message || "Something went wrong. Try again.";
      setError(message);
      setNeedsVerification(message.toLowerCase().includes("email not verified"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    success,
    setSuccess,
    error,
    setError,
    isLoading,
    needsVerification,
    handleLogin,
    togglePasswordVisibility,
  };
};

export default useLogin;
