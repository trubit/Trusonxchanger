let _io = null;

export const setNotificationIo = (io) => { _io = io; };

export const emitNotification = (userId, notification) => {
  if (!_io) return;
  try {
    _io.to(`notifications:${userId}`).emit("NOTIFICATION", notification);
  } catch {}
};
