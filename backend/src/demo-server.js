/**
 * BussUp Demo Server - MongoDB gerektirmeyen, bellek ici depolama ile calisan versiyon
 * Tam ozellikli: kayit, giris, sohbet, gercek zamanli mesajlasma
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const JWT_SECRET = 'bussup-demo-secret-2024';
const COMPANY_DOMAIN = process.env.COMPANY_DOMAIN || 'sirket.com';
const PORT = process.env.PORT || 3000;

// ==================== IN-MEMORY DATABASE ====================
const db = {
  users: [],
  chats: [],
  messages: [],
  _nextId: 1,
  genId() { return (this._nextId++).toString().padStart(24, '0'); },
};

// Seed demo users
async function seedData() {
  const hash = await bcrypt.hash('123456', 12);
  db.users.push(
    { _id: db.genId(), email: `ali@${COMPANY_DOMAIN}`, password: hash, displayName: 'Ali Yilmaz', department: 'Yazilim', title: 'Senior Gelistirici', status: 'Merhaba! BussUp kullaniyorum.', isOnline: false, lastSeen: new Date(), avatar: null, createdAt: new Date() },
    { _id: db.genId(), email: `ayse@${COMPANY_DOMAIN}`, password: hash, displayName: 'Ayse Demir', department: 'Pazarlama', title: 'Pazarlama Muduru', status: 'Toplantidayim', isOnline: false, lastSeen: new Date(), avatar: null, createdAt: new Date() },
    { _id: db.genId(), email: `mehmet@${COMPANY_DOMAIN}`, password: hash, displayName: 'Mehmet Kaya', department: 'Yazilim', title: 'DevOps Muhendisi', status: 'Kodluyorum...', isOnline: false, lastSeen: new Date(), avatar: null, createdAt: new Date() },
    { _id: db.genId(), email: `zeynep@${COMPANY_DOMAIN}`, password: hash, displayName: 'Zeynep Ozturk', department: 'Insan Kaynaklari', title: 'IK Uzmani', status: 'Musaitim', isOnline: false, lastSeen: new Date(), avatar: null, createdAt: new Date() },
  );
  console.log(`Demo kullanicilar olusturuldu (sifre: 123456, domain: @${COMPANY_DOMAIN})`);
}

function safeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

// ==================== EXPRESS APP ====================
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Auth middleware
function auth(req, res, next) {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
  }
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    const user = db.users.find(u => u._id === decoded.userId);
    if (!user) return res.status(401).json({ error: 'Kullanici bulunamadi.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Gecersiz token.' });
  }
}

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName, department, title } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'E-posta, sifre ve gorunen ad zorunludur.' });
  }
  const domain = email.split('@')[1];
  if (!domain || domain.toLowerCase() !== COMPANY_DOMAIN.toLowerCase()) {
    return res.status(403).json({ error: `Sadece @${COMPANY_DOMAIN} uzantili e-posta adresleri ile kayit olunabilir.` });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Sifre en az 6 karakter olmalidir.' });
  }
  if (db.users.find(u => u.email === email.toLowerCase())) {
    return res.status(400).json({ error: 'Bu e-posta adresi zaten kullaniliyor.' });
  }
  const hash = await bcrypt.hash(password, 12);
  const user = {
    _id: db.genId(), email: email.toLowerCase(), password: hash, displayName,
    department: department || '', title: title || '',
    status: 'Merhaba! BussUp kullaniyorum.', isOnline: true,
    lastSeen: new Date(), avatar: null, createdAt: new Date(),
  };
  db.users.push(user);
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ user: safeUser(user), token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve sifre gerekli.' });
  }
  const user = db.users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Gecersiz e-posta veya sifre.' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Gecersiz e-posta veya sifre.' });

  user.isOnline = true;
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ user: safeUser(user), token });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

app.put('/api/auth/profile', auth, (req, res) => {
  const allowed = ['displayName', 'status', 'department', 'title'];
  allowed.forEach(f => { if (req.body[f] !== undefined) req.user[f] = req.body[f]; });
  res.json({ user: safeUser(req.user) });
});

app.post('/api/auth/logout', auth, (req, res) => {
  req.user.isOnline = false;
  req.user.lastSeen = new Date();
  res.json({ message: 'Basariyla cikis yapildi.' });
});

// ==================== USER ROUTES ====================
app.get('/api/users', auth, (req, res) => {
  const { search } = req.query;
  let users = db.users.filter(u => u._id !== req.user._id);
  if (search) {
    const s = search.toLowerCase();
    users = users.filter(u =>
      u.displayName.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.department && u.department.toLowerCase().includes(s))
    );
  }
  res.json({ users: users.map(safeUser) });
});

// ==================== CHAT ROUTES ====================
app.get('/api/chats', auth, (req, res) => {
  const chats = db.chats
    .filter(c => c.participants.includes(req.user._id))
    .map(c => ({
      ...c,
      participants: c.participants.map(pid => safeUser(db.users.find(u => u._id === pid))),
      lastMessage: c.lastMessageId ? db.messages.find(m => m._id === c.lastMessageId) : null,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  // Populate sender in lastMessage
  chats.forEach(c => {
    if (c.lastMessage) {
      c.lastMessage = { ...c.lastMessage, sender: safeUser(db.users.find(u => u._id === c.lastMessage.sender)) };
    }
  });

  res.json({ chats });
});

app.post('/api/chats/direct', auth, (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Kullanici ID gerekli.' });
  if (userId === req.user._id) return res.status(400).json({ error: 'Kendinizle sohbet baslatamazsiniz.' });

  let chat = db.chats.find(c =>
    !c.isGroup && c.participants.includes(req.user._id) && c.participants.includes(userId) && c.participants.length === 2
  );

  if (chat) {
    const populated = {
      ...chat,
      participants: chat.participants.map(pid => safeUser(db.users.find(u => u._id === pid))),
    };
    return res.json({ chat: populated });
  }

  chat = {
    _id: db.genId(), isGroup: false, name: null,
    participants: [req.user._id, userId], admin: null,
    lastMessageId: null, updatedAt: new Date(), createdAt: new Date(),
  };
  db.chats.push(chat);
  const populated = {
    ...chat,
    participants: chat.participants.map(pid => safeUser(db.users.find(u => u._id === pid))),
  };
  res.status(201).json({ chat: populated });
});

app.post('/api/chats/group', auth, (req, res) => {
  const { name, participantIds } = req.body;
  if (!name || !participantIds || participantIds.length < 1) {
    return res.status(400).json({ error: 'Grup adi ve en az 1 katilimci gerekli.' });
  }
  const allParticipants = [req.user._id, ...participantIds];
  const chat = {
    _id: db.genId(), isGroup: true, name,
    participants: allParticipants, admin: req.user._id,
    lastMessageId: null, updatedAt: new Date(), createdAt: new Date(),
  };
  db.chats.push(chat);
  const populated = {
    ...chat,
    participants: allParticipants.map(pid => safeUser(db.users.find(u => u._id === pid))),
  };
  res.status(201).json({ chat: populated });
});

app.get('/api/chats/:chatId/messages', auth, (req, res) => {
  const chat = db.chats.find(c => c._id === req.params.chatId);
  if (!chat) return res.status(404).json({ error: 'Sohbet bulunamadi.' });
  if (!chat.participants.includes(req.user._id)) {
    return res.status(403).json({ error: 'Erisim yetkiniz yok.' });
  }
  const messages = db.messages
    .filter(m => m.chat === req.params.chatId)
    .map(m => ({ ...m, sender: safeUser(db.users.find(u => u._id === m.sender)) }))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json({ messages });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'BussUp Demo' });
});

// ==================== SOCKET.IO ====================
const onlineUsers = new Map();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Yetkilendirme gerekli'));
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.find(u => u._id === decoded.userId);
    if (!user) return next(new Error('Kullanici bulunamadi'));
    socket.userId = user._id;
    socket.user = user;
    next();
  } catch { next(new Error('Gecersiz token')); }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`⚡ ${socket.user.displayName} baglandi`);

  onlineUsers.set(userId, socket.id);
  socket.user.isOnline = true;
  io.emit('user:online', { userId });

  // Join chat rooms
  db.chats.filter(c => c.participants.includes(userId)).forEach(c => socket.join(c._id));

  socket.on('message:send', (data, callback) => {
    const { chatId, content, type = 'text' } = data;
    const chat = db.chats.find(c => c._id === chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return callback?.({ error: 'Sohbet bulunamadi.' });
    }

    const message = {
      _id: db.genId(), chat: chatId, sender: userId,
      content, type, readBy: [], deliveredTo: [],
      createdAt: new Date(),
    };
    db.messages.push(message);
    chat.lastMessageId = message._id;
    chat.updatedAt = new Date();

    const populated = { ...message, sender: safeUser(db.users.find(u => u._id === userId)) };

    socket.to(chatId).emit('message:received', { message: populated, chatId });
    callback?.({ message: populated });
  });

  socket.on('typing:start', (data) => {
    socket.to(data.chatId).emit('typing:start', {
      userId, chatId: data.chatId, displayName: socket.user.displayName,
    });
  });

  socket.on('typing:stop', (data) => {
    socket.to(data.chatId).emit('typing:stop', { userId, chatId: data.chatId });
  });

  socket.on('message:read', (data) => {
    const msg = db.messages.find(m => m._id === data.messageId);
    if (msg) {
      msg.readBy.push({ user: userId, readAt: new Date() });
      socket.to(data.chatId).emit('message:read', { messageId: data.messageId, userId, chatId: data.chatId });
    }
  });

  socket.on('chat:join', (chatId) => socket.join(chatId));

  socket.on('disconnect', () => {
    console.log(`💤 ${socket.user.displayName} ayrildi`);
    onlineUsers.delete(userId);
    socket.user.isOnline = false;
    socket.user.lastSeen = new Date();
    io.emit('user:offline', { userId, lastSeen: new Date() });
  });
});

// ==================== START ====================
seedData().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 BussUp Demo Server calisiyor: http://localhost:${PORT}`);
    console.log(`\n📋 Demo Hesaplar (sifre hepsi: 123456):`);
    console.log(`   ali@${COMPANY_DOMAIN}    - Yazilim / Senior Gelistirici`);
    console.log(`   ayse@${COMPANY_DOMAIN}   - Pazarlama / Pazarlama Muduru`);
    console.log(`   mehmet@${COMPANY_DOMAIN} - Yazilim / DevOps Muhendisi`);
    console.log(`   zeynep@${COMPANY_DOMAIN} - Insan Kaynaklari / IK Uzmani`);
    console.log(`\n   Yeni kayit icin @${COMPANY_DOMAIN} uzantili herhangi bir e-posta kullanin.\n`);
  });
});
