import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys.js";
import { walletApi } from "../../services/api/wallet.js";

export const useMyWalletsQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.wallet.myWallets,
    queryFn:  () => walletApi.getWallets(),
    enabled,
    staleTime: 30_000,
    select: (data) => data?.wallets ?? [],
  });

export const useWalletTransactionsQuery = (params = {}, enabled = true) =>
  useQuery({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn:  () => walletApi.getTransactions(params),
    enabled,
    staleTime: 20_000,
  });

export const useDepositMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => walletApi.deposit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet.myWallets });
      qc.invalidateQueries({ queryKey: queryKeys.wallet.allTransactions });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const useWithdrawMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => walletApi.withdraw(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet.myWallets });
      qc.invalidateQueries({ queryKey: queryKeys.wallet.allTransactions });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};
