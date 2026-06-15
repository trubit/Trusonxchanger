export const fmtUsd = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

export const fmtCrypto = (value, precision = 6) =>
  Number(value || 0).toFixed(precision);

export const fmtDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleString() : "—";
