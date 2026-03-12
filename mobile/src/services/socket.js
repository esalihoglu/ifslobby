import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'http://localhost:3000';

let socket = null;

export async function connectSocket() {
  const token = await AsyncStorage.getItem('token');
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket baglantisi kuruldu');
  });

  socket.on('connect_error', (error) => {
    console.log('Socket baglanti hatasi:', error.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function sendMessage(chatId, content, type = 'text') {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket baglantisi yok'));
    socket.emit('message:send', { chatId, content, type }, (response) => {
      if (response.error) reject(new Error(response.error));
      else resolve(response.message);
    });
  });
}

export function startTyping(chatId) {
  socket?.emit('typing:start', { chatId });
}

export function stopTyping(chatId) {
  socket?.emit('typing:stop', { chatId });
}

export function markAsRead(messageId, chatId) {
  socket?.emit('message:read', { messageId, chatId });
}

export function joinChat(chatId) {
  socket?.emit('chat:join', chatId);
}
