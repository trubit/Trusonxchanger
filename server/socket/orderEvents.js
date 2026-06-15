// Singleton io reference — set once from socketServer.js during startup.
let _io = null;

export const setOrderIo = (io) => {
  _io = io;
};

const emit = (room, event, data) => {
  if (!_io) return;
  try { _io.to(room).emit(event, data); } catch {}
};

export const emitOrderCreated   = (userId, data) => emit(`orders:${userId}`, "ORDER_CREATED",   data);
export const emitOrderCancelled = (userId, data) => emit(`orders:${userId}`, "ORDER_CANCELLED", data);
export const emitOrderUpdated   = (userId, data) => emit(`orders:${userId}`, "ORDER_UPDATED",   data);
