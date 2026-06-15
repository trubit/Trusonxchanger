// Singleton io reference set once from socketServer.js.
let _io = null;

export const setWalletIo = (io) => {
  _io = io;
};

export const emitWalletUpdated = (userId, data) => {
  if (!_io) return;
  try {
    _io.to(`wallet:${userId}`).emit("WALLET_UPDATED", data);
  } catch {}
};

export const emitTransactionCreated = (userId, data) => {
  if (!_io) return;
  try {
    _io.to(`wallet:${userId}`).emit("TRANSACTION_CREATED", data);
  } catch {}
};
