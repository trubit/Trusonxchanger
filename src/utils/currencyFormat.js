const FALLBACK_CURRENCY = "USD";

const normalizeNumeric = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeCurrencyCode = (code) =>
  String(code || FALLBACK_CURRENCY).toUpperCase();

export const getCurrencyRate = (currency, rates) => {
  const code = normalizeCurrencyCode(currency);
  if (code === FALLBACK_CURRENCY) {
    return 1;
  }

  const rate = Number(rates?.[code]);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
};

export const convertUsdAmount = (value, currency, rates) => {
  const amount = normalizeNumeric(value);
  const rate = getCurrencyRate(currency, rates);
  return rate ? amount * rate : amount;
};

export const formatCurrencyAmount = (
  value,
  currency,
  rates,
  {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = {},
) => {
  const code = normalizeCurrencyCode(currency);
  const converted = convertUsdAmount(value, code, rates);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(converted);
  } catch {
    return `${code} ${converted.toLocaleString(undefined, {
      minimumFractionDigits,
      maximumFractionDigits,
    })}`;
  }
};

export const formatCompactCurrencyAmount = (value, currency, rates) => {
  const code = normalizeCurrencyCode(currency);
  const converted = convertUsdAmount(value, code, rates);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(converted);
  } catch {
    return formatCurrencyAmount(converted, code, null, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
};

export const formatPriceAmount = (value, currency, rates) => {
  const amount = normalizeNumeric(value);
  const absAmount = Math.abs(amount);
  const decimals = absAmount >= 100 ? 2 : absAmount >= 1 ? 4 : 6;
  return formatCurrencyAmount(amount, currency, rates, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
};
