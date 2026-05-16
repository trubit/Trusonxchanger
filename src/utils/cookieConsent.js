const CONSENT_COOKIE_NAME = "xch_cookie_consent";
const CONSENT_COOKIE_MAX_AGE = 31536000;
const CONSENT_CHANGE_EVENT = "xch:cookie-consent-changed";

const DEFAULT_PREFERENCES = Object.freeze({
  essential: true,
  functional: false,
  analytical: false,
  tracking: false,
});

const ALL_ENABLED_PREFERENCES = Object.freeze({
  essential: true,
  functional: true,
  analytical: true,
  tracking: true,
});

const loadedScriptIds = new Set();
const scriptRegistry = {
  functional: [],
  analytical: [],
  tracking: [],
};

const parseBoolean = (value) => value === true;

const getCookieValue = (name) => {
  if (typeof document === "undefined") {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const pairs = document.cookie ? document.cookie.split("; ") : [];
  const cookiePair = pairs.find((entry) => entry.startsWith(encodedName));
  if (!cookiePair) {
    return null;
  }

  return decodeURIComponent(cookiePair.slice(encodedName.length));
};

const setCookieValue = (name, value) => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie =
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ` +
    `max-age=${CONSENT_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
};

const normaliseCustomPreferences = (value) => ({
  essential: true,
  functional: parseBoolean(value?.functional),
  analytical: parseBoolean(value?.analytical),
  tracking: parseBoolean(value?.tracking),
});

const createConsent = (value, preferences, type = "valid") => ({
  type,
  value,
  preferences,
});

export const getDefaultPreferences = () => ({ ...DEFAULT_PREFERENCES });

export const getConsentCookieName = () => CONSENT_COOKIE_NAME;

export const parseConsent = () => {
  const rawValue = getCookieValue(CONSENT_COOKIE_NAME);

  if (!rawValue) {
    return createConsent(null, getDefaultPreferences(), "missing");
  }

  if (rawValue === "all") {
    return createConsent("all", { ...ALL_ENABLED_PREFERENCES });
  }

  if (rawValue === "essential") {
    return createConsent("essential", getDefaultPreferences());
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && typeof parsed === "object") {
      return createConsent(rawValue, normaliseCustomPreferences(parsed));
    }
  } catch {
    return createConsent(rawValue, getDefaultPreferences(), "invalid");
  }

  return createConsent(rawValue, getDefaultPreferences(), "invalid");
};

export const hasValidConsent = (consent) => consent?.type === "valid";

const dispatchConsentChanged = (consent) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CONSENT_CHANGE_EVENT, {
      detail: consent,
    }),
  );
};

const writeConsent = (rawValue) => {
  setCookieValue(CONSENT_COOKIE_NAME, rawValue);
  const consent = parseConsent();
  dispatchConsentChanged(consent);
  return consent;
};

export const acceptAllConsent = () => writeConsent("all");

export const rejectNonEssentialConsent = () => writeConsent("essential");

export const saveCustomConsent = (preferences) => {
  const safePreferences = normaliseCustomPreferences(preferences);
  const rawValue = JSON.stringify({
    functional: safePreferences.functional,
    analytical: safePreferences.analytical,
    tracking: safePreferences.tracking,
  });
  return writeConsent(rawValue);
};

const appendScript = (id, src) =>
  new Promise((resolve, reject) => {
    if (loadedScriptIds.has(id)) {
      resolve();
      return;
    }

    const existing = document.getElementById(id);
    if (existing) {
      loadedScriptIds.add(id);
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      loadedScriptIds.add(id);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

const ensureTranslateContainer = () => {
  if (document.getElementById("google_translate_element")) {
    return;
  }

  const container = document.createElement("div");
  container.id = "google_translate_element";
  container.hidden = true;
  document.body.appendChild(container);
};

const installTranslateInit = () => {
  if (window.__xchTranslateInitInstalled) {
    return;
  }

  window.__xchTranslateInitInstalled = true;
  window.googleTranslateElementInit = () => {
    if (!window.google?.translate?.TranslateElement) {
      return;
    }

    ensureTranslateContainer();
    if (!window.__xchTranslateElementCreated) {
      // Google Translate widget is needed for the language selector flow.
      // eslint-disable-next-line no-undef
      new google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,es,bn,fr,de,zh-CN",
          autoDisplay: false,
        },
        "google_translate_element",
      );
      window.__xchTranslateElementCreated = true;
    }

    window.setTimeout(() => {
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = "en";
        select.dispatchEvent(new Event("change"));
      }
    }, 1500);
  };
};

const loadGoogleTranslateScript = async () => {
  const host = window.location.hostname || "";
  const isPrivateHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

  if (isPrivateHost) {
    return;
  }

  installTranslateInit();
  await appendScript(
    "xch-google-translate-script",
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit",
  );
};

const loadGoogleIdentityScript = () =>
  appendScript("xch-google-identity-script", "https://accounts.google.com/gsi/client");

scriptRegistry.functional.push(loadGoogleIdentityScript, loadGoogleTranslateScript);

export const registerConsentScript = (category, loader) => {
  if (!scriptRegistry[category] || typeof loader !== "function") {
    return;
  }

  scriptRegistry[category].push(loader);
};

export const applyConsentScripts = async (consent) => {
  if (!hasValidConsent(consent)) {
    return;
  }

  const allowedCategories = ["functional", "analytical", "tracking"].filter(
    (category) => consent.preferences[category],
  );

  for (const category of allowedCategories) {
    const loaders = scriptRegistry[category] || [];
    for (const loadScript of loaders) {
      try {
        await loadScript();
      } catch {
        // Failed optional script should not break the app.
      }
    }
  }
};

export const consentEventName = CONSENT_CHANGE_EVENT;
