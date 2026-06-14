export const registerNotificationSocket = (io, socket) => {
  socket.on('notifications:subscribe', (userId) => {
    if (userId) socket.join('user:' + userId);
  });
};

export default registerNotificationSocket;
