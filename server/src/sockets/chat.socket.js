export const registerChatSocket = (io, socket) => {
  socket.on('chat:join', (channelId) => {
    if (channelId) socket.join('channel:' + channelId);
  });

  socket.on('chat:message', (payload) => {
    if (payload && payload.channelId) {
      io.to('channel:' + payload.channelId).emit('chat:message', payload);
    }
  });

  socket.on('chat:typing', (payload) => {
    if (payload && payload.channelId) {
      socket.to('channel:' + payload.channelId).emit('chat:typing', payload);
    }
  });
};

export default registerChatSocket;
