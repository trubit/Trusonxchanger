import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import getCurrency from "../../services/api/currencyApi";

export const useCurrencyRatesQuery = (base = "USD") =>
  useQuery({
    queryKey: queryKeys.currency.rates(base),
    queryFn: async () => {
      const payload = await getCurrency(base);
      return payload?.rates || {};
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

