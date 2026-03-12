const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

// ========== CONFIG TESTS ==========
console.log('\n⚙️  Config Testleri');

process.env.PORT = '4000';
process.env.MONGODB_URI = 'mongodb://test:27017/testdb';
process.env.JWT_SECRET = 'my-secret';
process.env.COMPANY_DOMAIN = 'acme.com';

// Clear require cache
delete require.cache[require.resolve('./src/config')];
const config = require('./src/config');

test('Port dogru okunuyor', () => {
  assert.strictEqual(config.port, '4000');
});
test('MongoDB URI dogru okunuyor', () => {
  assert.strictEqual(config.mongoUri, 'mongodb://test:27017/testdb');
});
test('JWT secret dogru okunuyor', () => {
  assert.strictEqual(config.jwtSecret, 'my-secret');
});
test('Company domain dogru okunuyor', () => {
  assert.strictEqual(config.companyDomain, 'acme.com');
});

// ========== DOMAIN CHECK MIDDLEWARE TESTS ==========
console.log('\n🔒 Domain Check Middleware Testleri');

// Reset domain for tests
process.env.COMPANY_DOMAIN = 'sirket.com';
delete require.cache[require.resolve('./src/config')];
delete require.cache[require.resolve('./src/middleware/domainCheck')];
const domainCheck = require('./src/middleware/domainCheck');

function mockReqRes(body = {}) {
  let statusCode = null;
  let jsonBody = null;
  let nextCalled = false;
  return {
    req: { body },
    res: {
      status(code) { statusCode = code; return this; },
      json(data) { jsonBody = data; },
    },
    next: () => { nextCalled = true; },
    getStatus: () => statusCode,
    getJson: () => jsonBody,
    wasNextCalled: () => nextCalled,
  };
}

test('E-posta olmadan red (400)', () => {
  const m = mockReqRes({});
  domainCheck(m.req, m.res, m.next);
  assert.strictEqual(m.getStatus(), 400);
  assert.ok(!m.wasNextCalled());
});

test('Yanlis domain red (403)', () => {
  const m = mockReqRes({ email: 'user@gmail.com' });
  domainCheck(m.req, m.res, m.next);
  assert.strictEqual(m.getStatus(), 403);
  assert.ok(m.getJson().error.includes('sirket.com'));
});

test('Dogru domain kabul', () => {
  const m = mockReqRes({ email: 'ali@sirket.com' });
  domainCheck(m.req, m.res, m.next);
  assert.ok(m.wasNextCalled());
});

test('Buyuk-kucuk harf duyarsiz domain', () => {
  const m = mockReqRes({ email: 'ali@SIRKET.COM' });
  domainCheck(m.req, m.res, m.next);
  assert.ok(m.wasNextCalled());
});

test('@ isareti olmayan e-posta red', () => {
  const m = mockReqRes({ email: 'invalidemail' });
  domainCheck(m.req, m.res, m.next);
  assert.strictEqual(m.getStatus(), 403);
});

// ========== AUTH MIDDLEWARE TESTS ==========
console.log('\n🛡️  Auth Middleware Testleri');

const jwt = require('jsonwebtoken');

// We can't test full auth middleware without mongoose, but we can test JWT logic
test('JWT token olusturma ve dogrulama', () => {
  const payload = { userId: '507f1f77bcf86cd799439011' };
  const token = jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
  const decoded = jwt.verify(token, 'test-secret');
  assert.strictEqual(decoded.userId, payload.userId);
});

test('Yanlis secret ile token dogrulama bozulur', () => {
  const token = jwt.sign({ userId: 'abc' }, 'correct-secret');
  assert.throws(() => jwt.verify(token, 'wrong-secret'));
});

test('Suresi dolmus token reddedilir', () => {
  const token = jwt.sign({ userId: 'abc' }, 'test-secret', { expiresIn: '-1s' });
  assert.throws(() => jwt.verify(token, 'test-secret'));
});

// ========== USER MODEL TESTS ==========
console.log('\n👤 User Model Testleri');

const bcrypt = require('bcryptjs');

test('Sifre hashleme dogru calisiyor', async () => {
  const password = 'test123456';
  const hash = await bcrypt.hash(password, 12);
  assert.notStrictEqual(hash, password);
  assert.ok(hash.startsWith('$2a$'));
});

test('Sifre karsilastirma dogru calisiyor', async () => {
  const password = 'mypassword';
  const hash = await bcrypt.hash(password, 12);
  const isMatch = await bcrypt.compare(password, hash);
  assert.strictEqual(isMatch, true);
});

test('Yanlis sifre karsilastirmasi basarisiz', async () => {
  const hash = await bcrypt.hash('correct', 12);
  const isMatch = await bcrypt.compare('wrong', hash);
  assert.strictEqual(isMatch, false);
});

// ========== USER MODEL SCHEMA VALIDATION ==========
console.log('\n📋 Model Schema Dogrulama');

// We can validate mongoose schemas without connecting
const mongoose = require('mongoose');

// User schema
const UserSchema = require('./src/models/User').schema;

test('User modeli gerekli alanlara sahip', () => {
  assert.ok(UserSchema.paths.email);
  assert.ok(UserSchema.paths.password);
  assert.ok(UserSchema.paths.displayName);
  assert.ok(UserSchema.paths.status);
  assert.ok(UserSchema.paths.isOnline);
  assert.ok(UserSchema.paths.lastSeen);
  assert.ok(UserSchema.paths.department);
  assert.ok(UserSchema.paths.title);
  assert.ok(UserSchema.paths.avatar);
});

test('Email alani unique ve required', () => {
  assert.strictEqual(UserSchema.paths.email.options.required, true);
  assert.strictEqual(UserSchema.paths.email.options.unique, true);
});

test('Password minimum uzunluk 6', () => {
  assert.strictEqual(UserSchema.paths.password.options.minlength, 6);
});

test('Varsayilan durum mesaji ayarli', () => {
  assert.strictEqual(UserSchema.paths.status.options.default, 'Merhaba! BussUp kullaniyorum.');
});

test('isOnline varsayilan false', () => {
  assert.strictEqual(UserSchema.paths.isOnline.options.default, false);
});

// Message schema
const MessageSchema = require('./src/models/Message').schema;

test('Message modeli gerekli alanlara sahip', () => {
  assert.ok(MessageSchema.paths.chat);
  assert.ok(MessageSchema.paths.sender);
  assert.ok(MessageSchema.paths.content);
  assert.ok(MessageSchema.paths.type);
  assert.ok(MessageSchema.paths.readBy);
  assert.ok(MessageSchema.paths.deliveredTo);
});

test('Message type enum degerleri dogru', () => {
  const enumValues = MessageSchema.paths.type.options.enum;
  assert.deepStrictEqual(enumValues, ['text', 'image', 'file']);
});

test('Message varsayilan type text', () => {
  assert.strictEqual(MessageSchema.paths.type.options.default, 'text');
});

// Chat schema
const ChatSchema = require('./src/models/Chat').schema;

test('Chat modeli gerekli alanlara sahip', () => {
  assert.ok(ChatSchema.paths.isGroup);
  assert.ok(ChatSchema.paths.name);
  assert.ok(ChatSchema.paths.participants);
  assert.ok(ChatSchema.paths.admin);
  assert.ok(ChatSchema.paths.lastMessage);
});

test('Chat isGroup varsayilan false', () => {
  assert.strictEqual(ChatSchema.paths.isGroup.options.default, false);
});

// ========== API ROUTE STRUCTURE TESTS ==========
console.log('\n🛣️  Route Yapilandirma Testleri');

const express = require('express');

test('Auth route modulu yuklenebiliyor', () => {
  const authRoutes = require('./src/routes/auth');
  assert.ok(authRoutes);
  assert.strictEqual(typeof authRoutes, 'function'); // Express router
});

test('Users route modulu yuklenebiliyor', () => {
  const userRoutes = require('./src/routes/users');
  assert.ok(userRoutes);
  assert.strictEqual(typeof userRoutes, 'function');
});

test('Chats route modulu yuklenebiliyor', () => {
  const chatRoutes = require('./src/routes/chats');
  assert.ok(chatRoutes);
  assert.strictEqual(typeof chatRoutes, 'function');
});

test('Socket handler modulu yuklenebiliyor', () => {
  const socketHandler = require('./src/services/socketHandler');
  assert.ok(socketHandler);
  assert.strictEqual(typeof socketHandler, 'function');
});

// ========== AUTH ROUTE ENDPOINT TESTS ==========
console.log('\n🔑 Auth Endpoint Route Testleri');

const authRouter = require('./src/routes/auth');

function getRouteInfo(router) {
  const routes = [];
  router.stack.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods);
      routes.push({ method: methods[0], path: layer.route.path });
    }
  });
  return routes;
}

const authRoutes = getRouteInfo(authRouter);

test('POST /register endpoint var', () => {
  assert.ok(authRoutes.find(r => r.method === 'post' && r.path === '/register'));
});

test('POST /login endpoint var', () => {
  assert.ok(authRoutes.find(r => r.method === 'post' && r.path === '/login'));
});

test('PUT /profile endpoint var', () => {
  assert.ok(authRoutes.find(r => r.method === 'put' && r.path === '/profile'));
});

test('GET /me endpoint var', () => {
  assert.ok(authRoutes.find(r => r.method === 'get' && r.path === '/me'));
});

test('POST /logout endpoint var', () => {
  assert.ok(authRoutes.find(r => r.method === 'post' && r.path === '/logout'));
});

// ========== CHAT ROUTE ENDPOINT TESTS ==========
console.log('\n💬 Chat Endpoint Route Testleri');

const chatRouter = require('./src/routes/chats');
const chatRoutesList = getRouteInfo(chatRouter);

test('GET / (sohbet listesi) endpoint var', () => {
  assert.ok(chatRoutesList.find(r => r.method === 'get' && r.path === '/'));
});

test('POST /direct endpoint var', () => {
  assert.ok(chatRoutesList.find(r => r.method === 'post' && r.path === '/direct'));
});

test('POST /group endpoint var', () => {
  assert.ok(chatRoutesList.find(r => r.method === 'post' && r.path === '/group'));
});

test('POST /:chatId/participants endpoint var', () => {
  assert.ok(chatRoutesList.find(r => r.method === 'post' && r.path === '/:chatId/participants'));
});

test('GET /:chatId/messages endpoint var', () => {
  assert.ok(chatRoutesList.find(r => r.method === 'get' && r.path === '/:chatId/messages'));
});

// ========== EXPRESS APP INTEGRATION TEST ==========
console.log('\n🚀 Express App Entegrasyon Testi');

const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/users', require('./src/routes/users'));
app.use('/api/chats', chatRouter);
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'BussUp API' }));

const server = http.createServer(app);

async function integrationTests() {
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost', port, path, method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (token) options.headers['Authorization'] = `Bearer ${token}`;
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  // Health check
  const health = await request('GET', '/api/health');
  test('Health check 200 donuyor', () => {
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'ok');
    assert.strictEqual(health.body.service, 'BussUp API');
  });

  // Domain check on register
  const badDomain = await request('POST', '/api/auth/register', {
    email: 'user@gmail.com', password: '123456', displayName: 'Test',
  });
  test('Yanlis domain ile kayit 403 donuyor', () => {
    assert.strictEqual(badDomain.status, 403);
  });

  // No email on register
  const noEmail = await request('POST', '/api/auth/register', {
    password: '123456', displayName: 'Test',
  });
  test('E-posta olmadan kayit 400 donuyor', () => {
    assert.strictEqual(noEmail.status, 400);
  });

  // Token olmadan protected route
  const noAuth = await request('GET', '/api/auth/me');
  test('Token olmadan /me 401 donuyor', () => {
    assert.strictEqual(noAuth.status, 401);
  });

  // Invalid token
  const badAuth = await request('GET', '/api/auth/me', null, 'invalidtoken');
  test('Gecersiz token ile /me 401 donuyor', () => {
    assert.strictEqual(badAuth.status, 401);
  });

  // Token olmadan users
  const noAuthUsers = await request('GET', '/api/users');
  test('Token olmadan /users 401 donuyor', () => {
    assert.strictEqual(noAuthUsers.status, 401);
  });

  // Token olmadan chats
  const noAuthChats = await request('GET', '/api/chats');
  test('Token olmadan /chats 401 donuyor', () => {
    assert.strictEqual(noAuthChats.status, 401);
  });

  server.close();
}

integrationTests().then(() => {
  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Sonuc: ${passed} basarili, ${failed} basarisiz (toplam ${passed + failed})`);
  console.log('='.repeat(50) + '\n');
  process.exit(failed > 0 ? 1 : 0);
}).catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
