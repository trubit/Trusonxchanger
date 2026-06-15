/* eslint-disable react-refresh/only-export-components */
// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCurrencyRatesQuery } from "../../hooks/queries/useCurrencyRatesQuery";

const AppContext = createContext();
const SUPPORTED_LANGUAGES = ["en", "es", "bn", "fr", "de", "zh-CN"];
const DEFAULT_LANGUAGE = "en";
const GOOGLE_TRANSLATE_SCRIPT_ID = "xch-google-translate-script";
const GOOGLE_TRANSLATE_CONTAINER_ID = "google_translate_element";

const normaliseLanguage = (language) =>
  SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

const getStoredLanguage = () => DEFAULT_LANGUAGE;

const getStoredCurrency = () => localStorage.getItem("currency") || "USD";

const ensureTranslateContainer = () => {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(GOOGLE_TRANSLATE_CONTAINER_ID)) {
    return;
  }

  const container = document.createElement("div");
  container.id = GOOGLE_TRANSLATE_CONTAINER_ID;
  container.hidden = true;
  document.body.appendChild(container);
};

const setGoogTransCookie = (language) => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const safeLanguage = normaliseLanguage(language);
  const cookieValue = `/en/${safeLanguage}`;

  document.cookie = `googtrans=${cookieValue}; path=/`;

  const hostname = window.location.hostname;
  if (hostname && !["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)) {
    const baseDomain = hostname.startsWith("www.")
      ? hostname.slice(4)
      : hostname;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=.${baseDomain}`;
  }
};

const forceEnglishTranslateState = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const cookieValue = "/en/en";
  document.cookie = `googtrans=${cookieValue}; path=/`;

  const hostname = window.location.hostname;
  if (hostname && !["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)) {
    const baseDomain = hostname.startsWith("www.")
      ? hostname.slice(4)
      : hostname;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=.${baseDomain}`;
  }

  localStorage.setItem("language", DEFAULT_LANGUAGE);

  if (window.location.hash && window.location.hash.includes("googtrans")) {
    const cleanedUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", cleanedUrl);
  }
};

const triggerTranslateChange = (language) => {
  if (typeof document === "undefined") {
    return false;
  }

  const safeLanguage = normaliseLanguage(language);
  const select = document.querySelector(".goog-te-combo");
  if (!select) {
    return false;
  }

  if (select.value !== safeLanguage) {
    select.value = safeLanguage;
    select.dispatchEvent(new Event("change"));
  }

  return true;
};

const waitForTranslateSelect = (timeoutMs = 12000, intervalMs = 200) =>
  new Promise((resolve) => {
    const startTime = Date.now();

    const tick = () => {
      if (document.querySelector(".goog-te-combo")) {
        resolve(true);
        return;
      }

      if (Date.now() - startTime >= timeoutMs) {
        resolve(false);
        return;
      }

      window.setTimeout(tick, intervalMs);
    };

    tick();
  });

const createTranslateWidget = () => {
  if (!window.google?.translate?.TranslateElement) {
    return;
  }

  ensureTranslateContainer();

  if (window.__xchTranslateElementCreated) {
    return;
  }

  // eslint-disable-next-line no-undef
  new google.translate.TranslateElement(
    {
      pageLanguage: "en",
      includedLanguages: SUPPORTED_LANGUAGES.join(","),
      autoDisplay: false,
    },
    GOOGLE_TRANSLATE_CONTAINER_ID,
  );

  window.__xchTranslateElementCreated = true;
};

const ensureGoogleTranslateReady = async () => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  ensureTranslateContainer();

  if (window.google?.translate?.TranslateElement) {
    createTranslateWidget();
    return;
  }

  if (window.__xchTranslateScriptPromise) {
    await window.__xchTranslateScriptPromise;
    createTranslateWidget();
    return;
  }

  window.googleTranslateElementInit = () => {
    createTranslateWidget();
  };

  window.__xchTranslateScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Translate script.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Translate script."));
    document.head.appendChild(script);
  });

  try {
    await window.__xchTranslateScriptPromise;
    createTranslateWidget();
  } catch {
    // Keep app functional even if the optional script fails.
  }
};

const applyLanguage = async (language) => {
  const safeLanguage = normaliseLanguage(language);
  localStorage.setItem("language", safeLanguage);
  setGoogTransCookie(safeLanguage);

  // Keep startup in English and avoid loading Google Translate until a user picks another language.
  if (safeLanguage === DEFAULT_LANGUAGE) {
    triggerTranslateChange(DEFAULT_LANGUAGE);
    return;
  }

  if (!triggerTranslateChange(safeLanguage)) {
    await ensureGoogleTranslateReady();
    await waitForTranslateSelect();
    triggerTranslateChange(safeLanguage);
  }
};

// Global app context for language/currency preferences.
export const AppProvider = ({ children }) => {
  const location = useLocation();
  const [language, setLanguageState] = useState(getStoredLanguage());
  const [currency, setCurrencyState] = useState(getStoredCurrency());
  const ratesQuery = useCurrencyRatesQuery("USD");

  const setLanguage = (nextLanguage) => {
    const safeLanguage = normaliseLanguage(nextLanguage);
    setLanguageState(safeLanguage);
  };

  const setCurrency = (nextCurrency) => {
    setCurrencyState(nextCurrency);
  };

  useEffect(() => {
    forceEnglishTranslateState();
  }, []);

  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  useEffect(() => {
    // Re-apply selected language after route transitions in SPA navigation.
    applyLanguage(language);
  }, [location.pathname, language]);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        rates: ratesQuery.data || null,
        ratesLoading: ratesQuery.isLoading,
        ratesError: ratesQuery.error?.message || null,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
