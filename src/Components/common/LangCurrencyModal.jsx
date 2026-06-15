import { useState } from "react";
import { Button, Modal, Tabs, Tab, ListGroup } from "react-bootstrap";
import { useAppContext } from "./AppContext";
import "../../styles/LangCurrencyModal.css";

// Language and currency selector modal.
const LangCurrencyModal = () => {
  const {
    language,
    setLanguage,
    currency,
    setCurrency,
    rates,
    ratesLoading,
    ratesError,
  } = useAppContext();

  const [showModal, setShowModal] = useState(false);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "bn", name: "Bengali" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh-CN", name: "Chinese (Simplified)" },
  ];

  const currencies = [
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound" },
    { code: "NGN", name: "Nigerian Naira" },
    { code: "CAD", name: "Canadian Dollar" },
  ];

  return (
    <>
      <Button
        variant="dark"
        size="sm"
        className="tx-lang-currency-btn rounded-pill px-3 py-1 d-flex align-items-center gap-2 shadow-sm"
        onClick={() => setShowModal(true)}
      >
        <span className="tx-lc-pill">{language.toUpperCase()}</span>
        <span className="tx-lc-separator">/</span>
        <span className="tx-lc-pill">{currency}</span>
      </Button>

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

        <Modal.Body className="bg-dark text-white p-0 tx-lc-modal-body">
          <Tabs
            defaultActiveKey="language"
            id="lang-currency-tabs"
            className="border-0 mb-0 tx-lc-tabs"
            fill
          >
            <Tab eventKey="language" title="Language">
              <ListGroup variant="flush" className="tx-lc-list">
                {languages.map((lang) => (
                  <ListGroup.Item
                    key={lang.code}
                    action
                    active={lang.code === language}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowModal(false);
                    }}
                    className="tx-lc-item tx-lc-item-language bg-transparent border-0 py-3 px-4 text-white cursor-pointer"
                  >
                    <span className="tx-lc-item-name">{lang.name}</span>
                    <span className="tx-lc-item-code">{lang.code.toUpperCase()}</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Tab>

            <Tab eventKey="currency" title="Currency">
              <ListGroup variant="flush" className="tx-lc-list">
                {currencies.map((curr) => (
                  <ListGroup.Item
                    key={curr.code}
                    action
                    active={curr.code === currency}
                    onClick={() => {
                      setCurrency(curr.code);
                      setShowModal(false);
                    }}
                    className="tx-lc-item tx-lc-item-currency bg-transparent border-0 py-3 px-4 text-white cursor-pointer d-flex justify-content-between align-items-center"
                  >
                    <span className="tx-lc-currency-name">
                      {curr.name} <span className="tx-lc-item-code">{curr.code}</span>
                    </span>

                    {ratesLoading ? (
                      <span className="text-muted small tx-lc-rate">Loading...</span>
                    ) : ratesError ? (
                      <span className="text-danger small tx-lc-rate">Error</span>
                    ) : rates?.[curr.code] ? (
                      <span className="text-muted small tx-lc-rate">
                        1 USD = {rates[curr.code].toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-muted small tx-lc-rate">-</span>
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
