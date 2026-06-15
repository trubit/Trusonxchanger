import * as walletService from "../services/walletService.js";

export const getMyWallets = async (req, res) => {
  const wallets = await walletService.getWallets(req.user.id);
  res.json({ wallets });
};

export const deposit = async (req, res) => {
  const { wallet, transaction } = await walletService.deposit(req.user.id, req.body);
  res.status(200).json({ wallet, transaction });
};

export const withdraw = async (req, res) => {
  const { wallet, transaction } = await walletService.requestWithdrawal(req.user.id, req.body);
  res.status(200).json({ wallet, transaction });
};

export const getMyTransactions = async (req, res) => {
  const result = await walletService.getTransactions(req.user.id, req.query);
  res.json(result);
};
