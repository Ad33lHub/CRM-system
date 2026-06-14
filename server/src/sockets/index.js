import registerNotificationSocket from './notification.socket.js';
import registerChatSocket from './chat.socket.js';

export const registerSocketHandlers = (io, socket) => {
  registerNotificationSocket(io, socket);
  registerChatSocket(io, socket);
};

export default registerSocketHandlers;
