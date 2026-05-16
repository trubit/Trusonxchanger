/* eslint-disable react-refresh/only-export-components */
// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useCurrencyRatesQuery } from "../../hooks/queries/useCurrencyRatesQuery";

const AppContext = createContext();

// Global app context for language/currency preferences.
export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en",
  );
  const [currency, setCurrency] = useState(
    localStorage.getItem("currency") || "USD",
  );
  const ratesQuery = useCurrencyRatesQuery("USD");

  useEffect(() => {
    localStorage.setItem("language", language);
    // Trigger Google Translate change
    const select = document.querySelector("#google_translate_element select");
    if (select) {
      select.value = language;
      select.dispatchEvent(new Event("change"));
    }
  }, [language]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("language", language);
    localStorage.setItem("currency", currency);
  }, [language, currency]);

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
