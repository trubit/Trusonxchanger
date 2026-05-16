// src/components/LangCurrencyModal.jsx
import { useState, useEffect } from "react";
import { Button, Modal, Tabs, Tab, ListGroup } from "react-bootstrap";
import { useAppContext } from "./AppContext";
import "../../styles/LangCurrencyModal.css";

// Language/currency selector modal.
const LangCurrencyModal = () => {
  const {
    currency,
    setCurrency,
    rates,
    ratesLoading,
    ratesError,
    setLanguage,
  } = useAppContext();

  // Language is handled by Google Translate — we only store the code
  const [selectedLang, setSelectedLang] = useState(
    localStorage.getItem("language") || "en",
  );
  const [showModal, setShowModal] = useState(false);

  // Language options (Google Translate codes)
  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "bn", name: "Bengali" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh-CN", name: "Chinese (Simplified)" },
  ];

  // Currency options
  const currencies = [
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound" },
    { code: "NGN", name: "Nigerian Naira" },
    { code: "CAD", name: "Canadian Dollar" },
  ];

  // Auto-switch Google Translate when language changes
  useEffect(() => {
    localStorage.setItem("language", selectedLang);

    // Tell Google Translate to switch language
    const googleWidget = window.google?.translate?.TranslateElement?.Inst;
    if (googleWidget) {
      googleWidget.setLangPair("en", selectedLang);
    } else {
      // Fallback: add ?lang=xx to URL (works in many cases)
      const url = new URL(window.location);
      url.searchParams.set("lang", selectedLang);
      if (url.searchParams.get("lang") !== selectedLang) {
        window.location.href = url.toString();
      }
    }
  }, [selectedLang]);

  // Save currency
  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  return (
    <>
      {/* Compact button showing current language & currency */}
      <Button
        variant="dark"
        size="sm"
        className="tx-lang-currency-btn rounded-pill px-3 py-1 d-flex align-items-center gap-2 shadow-sm"
        onClick={() => setShowModal(true)}
      >
        <span className="fw-bold">{selectedLang.toUpperCase()}</span>
        <span className="text-muted">/</span>
        <span className="fw-bold">{currency}</span>
      </Button>

      {/* Modal for selection */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="md"
        dialogClassName="dark-modal"
      >
        <Modal.Header closeButton className="bg-dark border-0 text-white">
          <Modal.Title className="fw-bold fs-5">
            Change Language & Currency
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-dark text-white p-0">
          <Tabs
            defaultActiveKey="language"
            id="lang-currency-tabs"
            className="border-0 mb-0"
            fill
          >
            {/* Language Tab */}
            <Tab eventKey="language" title="Language">
              <ListGroup variant="flush">
                {languages.map((lang) => (
                  <ListGroup.Item
                    key={lang.code}
                    action
                    active={lang.code === selectedLang}
                    onClick={() => {
                      setSelectedLang(lang.code); // Your local state
                      setLanguage(lang.code); // Global context — triggers Google
                      setShowModal(false);
                    }}
                    className="bg-transparent border-0 py-3 px-4 text-white cursor-pointer"
                    style={{
                      backgroundColor:
                        lang.code === selectedLang
                          ? "#22c55e33"
                          : "transparent",
                    }}
                  >
                    {lang.name} ({lang.code.toUpperCase()})
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Tab>

            {/* Currency Tab with live rates */}
            <Tab eventKey="currency" title="Currency">
              <ListGroup variant="flush">
                {currencies.map((curr) => (
                  <ListGroup.Item
                    key={curr.code}
                    action
                    active={curr.code === currency}
                    onClick={() => {
                      setCurrency(curr.code);
                      setShowModal(false);
                    }}
                    className="bg-transparent border-0 py-3 px-4 text-white cursor-pointer d-flex justify-content-between align-items-center"
                    style={{
                      backgroundColor:
                        curr.code === currency ? "#22c55e33" : "transparent",
                    }}
                  >
                    <span>
                      {curr.name} ({curr.code})
                    </span>

                    {/* Real-time rate */}
                    {ratesLoading ? (
                      <span className="text-muted small">Loading...</span>
                    ) : ratesError ? (
                      <span className="text-danger small">Error</span>
                    ) : rates?.[curr.code] ? (
                      <span className="text-muted small">
                        1 USD = {rates[curr.code].toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default LangCurrencyModal;
