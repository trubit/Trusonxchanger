const API_BASE_URL =
  import.meta.env.VITE_TRUSON_API_URL || import.meta.env.VITE_API_URL || "";

// Fetch latest currency rates against USD via backend proxy.
const getCurrency = () => {
  return fetch(`${API_BASE_URL}/api/currency/latest?from=USD`, {
    headers: { "Content-Type": "application/json" },
  });
};

export default getCurrency;
