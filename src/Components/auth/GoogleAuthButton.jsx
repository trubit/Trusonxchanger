import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import "../../styles/google-auth.css";
import { googleAuth } from "../../services/api/auth";
import { API_BASE_URL } from "../../api/client";

const GOOGLE_GSI_SCRIPT_ID = "xch-google-identity-script";
const GOOGLE_GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let googleScriptLoadPromise = null;

const ensureGoogleIdentityScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptLoadPromise) {
    return googleScriptLoadPromise;
  }

  googleScriptLoadPromise = new Promise((resolve, reject) => {
    const resolveIfReady = () => {
      if (window.google?.accounts?.id) {
        resolve();
        return true;
      }
      return false;
    };

    if (resolveIfReady()) {
      return;
    }

    const existingScript = document.getElementById(GOOGLE_GSI_SCRIPT_ID);
    if (existingScript) {
      const onLoad = () => {
        if (!resolveIfReady()) {
          reject(new Error("Google script loaded but API is unavailable."));
        }
      };
      const onError = () => reject(new Error("Failed to load Google script."));
      existingScript.addEventListener("load", onLoad, { once: true });
      existingScript.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_GSI_SCRIPT_ID;
    script.src = GOOGLE_GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!resolveIfReady()) {
        reject(new Error("Google script loaded but API is unavailable."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Google script."));
    document.head.appendChild(script);
  }).catch((error) => {
    googleScriptLoadPromise = null;
    throw error;
  });

  return googleScriptLoadPromise;
};

const GoogleAuthButton = ({
  action = "signin",
  onSuccess,
  onError,
  referralId = "",
  disabled = false,
}) => {
  const buttonRef = useRef(null);
  const warnedRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const renderProbeTimerRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const [configMessage, setConfigMessage] = useState("");
  const [buttonWidth, setButtonWidth] = useState(320);
  const [forceRedirectFlow, setForceRedirectFlow] = useState(true);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasValidClientId =
    typeof clientId === "string" &&
    clientId.trim().endsWith(".apps.googleusercontent.com");

  const startGoogleRedirect = useCallback(() => {
    const params = new URLSearchParams({
      mode: action === "signup" ? "signup" : "signin",
      frontendUrl: window.location.origin,
    });

    if (action === "signup" && referralId.trim()) {
      params.set("referralId", referralId.trim());
    }

    window.location.assign(
      `${API_BASE_URL}/api/auth/google/start?${params.toString()}`,
    );
  }, [action, referralId]);

  const handleCredentialResponse = useCallback(
    async (response) => {
      if (!response?.credential) {
        onError?.("Google sign-in was cancelled. Please try again.");
        return;
      }

      setIsLoading(true);
      try {
        const extraPayload =
          referralId && action === "signup"
            ? { referralId: referralId.trim() }
            : {};
        const payload = await googleAuth(response.credential, extraPayload);

        if (action !== "signup") {
          localStorage.setItem("token", payload.token);
          localStorage.setItem("user", JSON.stringify(payload.user));
        }

        setConfigMessage("");
        onSuccess?.(payload);
      } catch (err) {
        onError?.(err.message || "Google authentication failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [action, onError, onSuccess, referralId],
  );

  useEffect(() => {
    if (forceRedirectFlow) {
      setConfigMessage("");
      return;
    }

    if (!clientId || !hasValidClientId) {
      if (!warnedRef.current) {
        setConfigMessage(
          "Google popup is unavailable. Continuing with secure Google redirect flow.",
        );
        warnedRef.current = true;
      }
      setForceRedirectFlow(true);
      return;
    }

    let isCancelled = false;
    setConfigMessage("");

    const syncGoogleReady = () => {
      if (isCancelled) {
        return;
      }
      setIsReady(Boolean(window.google?.accounts?.id));
    };

    ensureGoogleIdentityScript()
      .then(syncGoogleReady)
      .catch(() => {
        if (!isCancelled) {
          setConfigMessage(
            "Google sign-in is unavailable right now. Check your connection or disable content blockers, then refresh.",
          );
        }
      });

    const interval = setInterval(syncGoogleReady, 250);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [clientId, forceRedirectFlow, hasValidClientId]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 420px)");
    const updateMatch = () => setIsNarrowScreen(mediaQuery.matches);

    updateMatch();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateMatch);
      return () => mediaQuery.removeEventListener("change", updateMatch);
    }

    mediaQuery.addListener(updateMatch);
    return () => mediaQuery.removeListener(updateMatch);
  }, []);

  useEffect(() => {
    if (!buttonRef.current) {
      return;
    }

    const updateWidth = () => {
      const width = buttonRef.current?.clientWidth || 0;
      if (width > 0) {
        const maxWidth = isNarrowScreen ? 300 : 360;
        setButtonWidth(Math.min(maxWidth, width));
      }
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(buttonRef.current);
    return () => observer.disconnect();
  }, [isNarrowScreen]);

  useEffect(() => {
    if (
      !isReady ||
      !buttonRef.current ||
      disabled ||
      isLoading ||
      !clientId ||
      !hasValidClientId
    ) {
      return;
    }

    if (!hasInitializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        ux_mode: "popup",
        error_callback: () => {
          setForceRedirectFlow(true);
          setConfigMessage(
            "Google popup sign-in is unavailable on this origin. Continue with Google redirect flow.",
          );
          onError?.(
            "Google sign-in is unavailable for this app origin. Add this URL to Authorized JavaScript origins in Google Cloud console.",
          );
        },
      });
      hasInitializedRef.current = true;
    }

    setConfigMessage("");
    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      width: buttonWidth,
      text:
        action === "signup"
          ? isNarrowScreen
            ? "continue_with"
            : "signup_with"
          : isNarrowScreen
            ? "signin"
            : "signin_with",
    });

    if (renderProbeTimerRef.current) {
      window.clearTimeout(renderProbeTimerRef.current);
    }

    renderProbeTimerRef.current = window.setTimeout(() => {
      const hasIframe = Boolean(buttonRef.current?.querySelector("iframe"));
      if (!hasIframe) {
        setForceRedirectFlow(true);
        setConfigMessage(
          "Google popup failed to initialise on this origin. Continue with Google redirect flow.",
        );
      }
    }, 900);

    return () => {
      if (renderProbeTimerRef.current) {
        window.clearTimeout(renderProbeTimerRef.current);
        renderProbeTimerRef.current = null;
      }
    };
  }, [
    action,
    buttonWidth,
    clientId,
    disabled,
    handleCredentialResponse,
    hasValidClientId,
    isLoading,
    isNarrowScreen,
    isReady,
    onError,
  ]);

  return (
    <div
      className="google-auth-wrapper"
      aria-label={action === "signup" ? "Sign up with Google" : "Sign in with Google"}
    >
      <div
        className="google-auth-card"
        role="group"
        aria-label={action === "signup" ? "Sign up with Google" : "Sign in with Google"}
      >
        <div className="google-auth-card-header">
          <span className="google-auth-pill">Secure</span>
          <span className="google-auth-title">
            {action === "signup" ? "Create account with Google" : "Continue with Google"}
          </span>
        </div>

        {clientId && isReady && hasValidClientId && !forceRedirectFlow ? (
          <div
            className="google-button-shell"
            ref={buttonRef}
            aria-label={action === "signup" ? "Sign up with Google" : "Sign in with Google"}
          />
        ) : (
          <button
            className="google-auth-button"
            type="button"
            onClick={startGoogleRedirect}
            disabled={disabled || isLoading}
            aria-disabled={disabled || isLoading}
            aria-label={action === "signup" ? "Sign up with Google" : "Sign in with Google"}
          >
            <span className="google-auth-icon">G</span>
            Continue with Google
          </button>
        )}
      </div>

      {isLoading && (
        <div className="google-auth-loading small text-muted">
          <Spinner animation="border" size="sm" className="me-2" />
          Connecting to Google...
        </div>
      )}

      {configMessage && (
        <div className="google-auth-fallback small text-muted">{configMessage}</div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
