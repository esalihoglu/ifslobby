const express = require('express');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Sohbetleri listele
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', '-password')
      .populate('lastMessage')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'displayName' } })
      .sort({ updatedAt: -1 });

    res.json({ chats });
  } catch (error) {
    res.status(500).json({ error: 'Sohbetler getirilirken hata olustu.' });
  }
});

// Birebir sohbet olustur veya getir
router.post('/direct', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Kullanici ID gerekli.' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Kendinizle sohbet baslatamazsiniz.' });
    }

    // Mevcut sohbeti kontrol et
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId], $size: 2 },
    })
      .populate('participants', '-password')
      .populate('lastMessage');

    if (chat) {
      return res.json({ chat });
    }

    // Yeni sohbet olustur
    chat = new Chat({
      isGroup: false,
      participants: [req.user._id, userId],
    });
    await chat.save();

    chat = await Chat.findById(chat._id)
      .populate('participants', '-password');

    res.status(201).json({ chat });
  } catch (error) {
    res.status(500).json({ error: 'Sohbet olusturulurken hata olustu.' });
  }
});

// Grup sohbeti olustur
router.post('/group', auth, async (req, res) => {
  try {
    const { name, participantIds } = req.body;

    if (!name || !participantIds || participantIds.length < 1) {
      return res.status(400).json({ error: 'Grup adi ve en az 1 katilimci gerekli.' });
    }

    const allParticipants = [req.user._id, ...participantIds];

    const chat = new Chat({
      isGroup: true,
      name,
      participants: allParticipants,
      admin: req.user._id,
    });
    await chat.save();

    const populated = await Chat.findById(chat._id)
      .populate('participants', '-password');

    res.status(201).json({ chat: populated });
  } catch (error) {
    res.status(500).json({ error: 'Grup olusturulurken hata olustu.' });
  }
});

// Gruba katilimci ekle
router.post('/:chatId/participants', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ error: 'Grup bulunamadi.' });
    }

    if (chat.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Sadece grup yoneticisi katilimci ekleyebilir.' });
    }

    if (chat.participants.includes(userId)) {
      return res.status(400).json({ error: 'Kullanici zaten grupta.' });
    }

    chat.participants.push(userId);
    await chat.save();

    const populated = await Chat.findById(chat._id).populate('participants', '-password');
    res.json({ chat: populated });
  } catch (error) {
    res.status(500).json({ error: 'Katilimci eklenirken hata olustu.' });
  }
});

// Sohbet mesajlarini getir
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { before, limit = 50 } = req.query;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Sohbet bulunamadi.' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ error: 'Bu sohbete erisim yetkiniz yok.' });
    }

    const query = { chat: req.params.chatId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'displayName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: 'Mesajlar getirilirken hata olustu.' });
  }
});

module.exports = router;
