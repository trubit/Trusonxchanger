import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { cancelSpotOrder, placeSpotOrder } from "../../services/tradeService";

const invalidateTradeState = async (queryClient, symbol) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.trade.marketState(symbol) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.trade.myMarketState(symbol) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.trade.pairs }),
  ]);
};

export const usePlaceSpotOrderMutation = (symbol) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeSpotOrder,
    onSuccess: async (payload) => {
      const marketState = payload?.marketState;
      if (marketState) {
        queryClient.setQueryData(queryKeys.trade.myMarketState(symbol), marketState);
        queryClient.setQueryData(queryKeys.trade.marketState(symbol), marketState);
      }
      await invalidateTradeState(queryClient, symbol);
    },
  });
};

export const useCancelSpotOrderMutation = (symbol) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelSpotOrder,
    onSuccess: async (payload) => {
      const marketState = payload?.marketState;
      if (marketState) {
        queryClient.setQueryData(queryKeys.trade.myMarketState(symbol), marketState);
        queryClient.setQueryData(queryKeys.trade.marketState(symbol), marketState);
      }
      await invalidateTradeState(queryClient, symbol);
    },
  });
};

