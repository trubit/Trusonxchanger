import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api/auth";

// Login state + submit handler used by the Login page.
const useLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    return;
  };

  // Sends credentials to the backend and stores the session token on success.
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setNeedsVerification(false);
    setIsLoading(true);

    try {
      const data = await loginUser({ email, password });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess("Login successful!");
      navigate("/Dashboard");
    } catch (err) {
      const message = err.message || "Something went wrong. Try again.";
      setError(message);
      if (message.toLowerCase().includes("email not verified")) {
        setNeedsVerification(true);
      }
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
