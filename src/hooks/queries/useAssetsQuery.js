import { useQuery } from "@tanstack/react-query";
import { fetchSupportedAssets } from "../../services/api/assets.js";
import { queryKeys } from "../../api/queryKeys.js";

/**
 * Fetches the complete list of platform-supported assets (built-in + DB coins).
 * Returns an array of { symbol, name, network, decimals } objects.
 */
export const useSupportedAssets = (options = {}) =>
  useQuery({
    queryKey: queryKeys.assets.all,
    queryFn:  fetchSupportedAssets,
    staleTime: 5 * 60_000, // asset catalog rarely changes
    select:    (data) => data?.assets ?? [],
    ...options,
  });

/**
 * Returns a map of symbol → asset metadata for O(1) lookup.
 */
export const useAssetMap = () => {
  const { data: assets = [] } = useSupportedAssets();
  const map = {};
  for (const a of assets) map[a.symbol] = a;
  return map;
};
