const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Aktif kullanici-socket eslesmeleri
const onlineUsers = new Map();

function setupSocket(io) {
  // Kimlik dogrulama middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Yetkilendirme gerekli'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('Kullanici bulunamadi'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Gecersiz token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`Kullanici baglandi: ${socket.user.displayName}`);

    // Kullaniciyi cevrimici olarak isaretle
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user:online', { userId });

    // Kullanicinin sohbet odalarina katil
    const chats = await Chat.find({ participants: userId });
    chats.forEach((chat) => {
      socket.join(chat._id.toString());
    });

    // Mesaj gonder
    socket.on('message:send', async (data, callback) => {
      try {
        const { chatId, content, type = 'text' } = data;

        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.map(String).includes(userId)) {
          return callback?.({ error: 'Sohbet bulunamadi veya erisim yok.' });
        }

        const message = new Message({
          chat: chatId,
          sender: userId,
          content,
          type,
        });
        await message.save();

        // lastMessage guncelle
        chat.lastMessage = message._id;
        await chat.save();

        const populated = await Message.findById(message._id)
          .populate('sender', 'displayName avatar');

        // Sohbet odasina mesaji yayinla
        socket.to(chatId).emit('message:received', {
          message: populated,
          chatId,
        });

        // Gonderene onay
        callback?.({ message: populated });

        // Teslim bildirimi
        chat.participants.forEach((participantId) => {
          const pid = participantId.toString();
          if (pid !== userId && onlineUsers.has(pid)) {
            message.deliveredTo.push({ user: participantId });
          }
        });
        await message.save();
      } catch (error) {
        callback?.({ error: 'Mesaj gonderilemedi.' });
      }
    });

    // Yazma durumu
    socket.on('typing:start', (data) => {
      socket.to(data.chatId).emit('typing:start', {
        userId,
        chatId: data.chatId,
        displayName: socket.user.displayName,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.chatId).emit('typing:stop', {
        userId,
        chatId: data.chatId,
      });
    });

    // Mesaj okundu
    socket.on('message:read', async (data) => {
      try {
        const { messageId, chatId } = data;
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: { user: userId } },
        });

        socket.to(chatId).emit('message:read', {
          messageId,
          userId,
          chatId,
        });
      } catch (error) {
        // Sessizce devam et
      }
    });

    // Sohbet odasina katil
    socket.on('chat:join', (chatId) => {
      socket.join(chatId);
    });

    // Baglanti kesildi
    socket.on('disconnect', async () => {
      console.log(`Kullanici ayrildi: ${socket.user.displayName}`);
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io.emit('user:offline', { userId, lastSeen: new Date() });
    });
  });
}

module.exports = setupSocket;
