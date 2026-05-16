import { requestWithRetry } from "../../api/client";

const request = (url, options = {}) =>
  requestWithRetry({
    url,
    method: options.method || "GET",
    data: options.body,
    headers: options.headers,
    signal: options.signal,
  });

// Create a new account.
export const registerUser = (body) =>
  request("/api/auth/register", {
    method: "POST",
    body,
  });

// Log in with email + password.
export const loginUser = (body) =>
  request("/api/auth/login", {
    method: "POST",
    body,
  });

// Log in or sign up with Google (ID token).
export const googleAuth = (credential, extra = {}) =>
  request("/api/auth/google", {
    method: "POST",
    body: { credential, ...extra },
  });

// Ask the backend to send a reset email.
export const requestPasswordReset = (email) =>
  request("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });

// Send the token + new password to finish the reset.
export const resetPassword = (payload) =>
  request("/api/auth/reset-password", {
    method: "POST",
    body: payload,
  });

// Verify email using a 6-digit code (OTP).
export const verifyEmail = (code) =>
  request("/api/auth/verify-email", {
    method: "POST",
    body: { code },
  });

// Resend verification code for local accounts.
export const resendEmailVerification = (email) =>
  request("/api/auth/verify-email/resend", {
    method: "POST",
    body: { email },
  });

// Fetch current authenticated user.
export const getMe = () =>
  request("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  });
