const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function avatar(ctx, x, y, size, letter, color = '#075E54') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${size * 0.45}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(letter, x + size/2, y + size/2 + size * 0.16);
  ctx.textAlign = 'left';
}

function onlineDot(ctx, x, y, size) {
  ctx.fillStyle = '#25D366';
  ctx.beginPath();
  ctx.arc(x + size - 4, y + size - 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.stroke();
}

// ===== 1. LOGIN SCREEN =====
function drawLogin() {
  const c = createCanvas(1280, 800);
  const ctx = c.getContext('2d');

  // BG gradient
  const grad = ctx.createLinearGradient(0, 0, 1280, 800);
  grad.addColorStop(0, '#075E54');
  grad.addColorStop(1, '#128C7E');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 800);

  // Login box
  const bx = 440, by = 120, bw = 400, bh = 560;
  ctx.fillStyle = '#fff';
  roundRect(ctx, bx, by, bw, bh, 16);
  ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 30;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Logo
  ctx.fillStyle = '#075E54';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BussUp', bx + bw/2, by + 60);
  ctx.fillStyle = '#666';
  ctx.font = '16px sans-serif';
  ctx.fillText('Sirket Ici Mesajlasma', bx + bw/2, by + 88);
  ctx.textAlign = 'left';

  let y = by + 130;
  // Email field
  ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Sirket E-postasi', bx + 30, y); y += 20;
  ctx.fillStyle = '#f9f9f9'; roundRect(ctx, bx + 30, y, bw - 60, 48, 10); ctx.fill();
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; roundRect(ctx, bx + 30, y, bw - 60, 48, 10); ctx.stroke();
  ctx.fillStyle = '#aaa'; ctx.font = '15px sans-serif';
  ctx.fillText('ad@sirket.com', bx + 46, y + 30); y += 68;

  // Password
  ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Sifre', bx + 30, y); y += 20;
  ctx.fillStyle = '#f9f9f9'; roundRect(ctx, bx + 30, y, bw - 60, 48, 10); ctx.fill();
  ctx.strokeStyle = '#ddd'; roundRect(ctx, bx + 30, y, bw - 60, 48, 10); ctx.stroke();
  ctx.fillStyle = '#aaa'; ctx.font = '15px sans-serif';
  ctx.fillText('Sifrenizi girin', bx + 46, y + 30); y += 72;

  // Button
  ctx.fillStyle = '#075E54'; roundRect(ctx, bx + 30, y, bw - 60, 52, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Giris Yap', bx + bw/2, y + 32); ctx.textAlign = 'left'; y += 72;

  // Toggle
  ctx.fillStyle = '#666'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Hesabiniz yok mu?', bx + bw/2 - 40, y);
  ctx.fillStyle = '#075E54'; ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Kayit olun', bx + bw/2 + 60, y);
  ctx.textAlign = 'left';

  fs.writeFileSync(path.join(DIR, '01-giris-ekrani.png'), c.toBuffer('image/png'));
  console.log('   ✓ 01-giris-ekrani.png');
}

// ===== 2. REGISTER SCREEN =====
function drawRegister() {
  const c = createCanvas(1280, 800);
  const ctx = c.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 1280, 800);
  grad.addColorStop(0, '#075E54'); grad.addColorStop(1, '#128C7E');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1280, 800);

  const bx = 440, by = 50, bw = 400, bh = 700;
  ctx.fillStyle = '#fff'; roundRect(ctx, bx, by, bw, bh, 16); ctx.fill();

  ctx.fillStyle = '#075E54'; ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('BussUp', bx + bw/2, by + 55);
  ctx.fillStyle = '#666'; ctx.font = '14px sans-serif';
  ctx.fillText('Sirket e-postaniz ile hesap olusturun', bx + bw/2, by + 80);
  ctx.textAlign = 'left';

  const fields = [
    { label: 'Gorunen Ad *', placeholder: 'Adiniz Soyadiniz' },
    { label: 'Departman', placeholder: 'Ornegin: Yazilim' },
    { label: 'Sirket E-postasi *', placeholder: 'ad@sirket.com' },
    { label: 'Sifre *', placeholder: 'En az 6 karakter' },
  ];

  let y = by + 110;
  fields.forEach(f => {
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(f.label, bx + 30, y); y += 20;
    ctx.fillStyle = '#f9f9f9'; roundRect(ctx, bx + 30, y, bw - 60, 44, 10); ctx.fill();
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; roundRect(ctx, bx + 30, y, bw - 60, 44, 10); ctx.stroke();
    ctx.fillStyle = '#aaa'; ctx.font = '15px sans-serif';
    ctx.fillText(f.placeholder, bx + 46, y + 28); y += 62;
  });

  y += 8;
  ctx.fillStyle = '#075E54'; roundRect(ctx, bx + 30, y, bw - 60, 52, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Kayit Ol', bx + bw/2, y + 32); ctx.textAlign = 'left';

  y += 72;
  ctx.fillStyle = '#666'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Zaten hesabiniz var mi?', bx + bw/2 - 30, y);
  ctx.fillStyle = '#075E54'; ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Giris yapin', bx + bw/2 + 70, y);
  ctx.textAlign = 'left';

  fs.writeFileSync(path.join(DIR, '02-kayit-ekrani.png'), c.toBuffer('image/png'));
  console.log('   ✓ 02-kayit-ekrani.png');
}

// ===== 3. CHAT LIST =====
function drawChatList() {
  const c = createCanvas(1280, 800);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f0f2f5'; ctx.fillRect(0, 0, 1280, 800);

  // Sidebar
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 380, 800);
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(380, 0); ctx.lineTo(380, 800); ctx.stroke();

  // Header
  ctx.fillStyle = '#075E54'; ctx.fillRect(0, 0, 380, 64);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('BussUp', 20, 35);
  ctx.font = '12px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('Ali Yilmaz - Yazilim', 20, 52);

  // + Yeni button
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; roundRect(ctx, 280, 18, 80, 32, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('+ Yeni', 296, 39);

  // Search
  ctx.fillStyle = '#f6f6f6'; ctx.fillRect(0, 64, 380, 44);
  ctx.fillStyle = '#fff'; roundRect(ctx, 16, 74, 348, 26, 8); ctx.fill();
  ctx.fillStyle = '#aaa'; ctx.font = '14px sans-serif'; ctx.fillText('Sohbet ara...', 30, 92);

  // Chat items
  const chatItems = [
    { name: 'Ayse Demir', msg: 'Rica ederim, gorusuruz! 😊', time: '14:32', letter: 'A', online: true },
    { name: 'Yazilim Ekibi', msg: 'Mehmet: Deploy tamamlandi!', time: '13:15', letter: 'Y', online: false, isGroup: true },
    { name: 'Mehmet Kaya', msg: 'PR\'i inceleyebilir misin?', time: '11:45', letter: 'M', online: true },
    { name: 'Zeynep Ozturk', msg: 'Yeni calisanin belgeleri hazir.', time: 'Dun', letter: 'Z', online: false },
  ];

  let y = 108;
  chatItems.forEach((item, i) => {
    if (i === 0) { ctx.fillStyle = '#ebebeb'; ctx.fillRect(0, y, 380, 72); }
    ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(80, y + 72); ctx.lineTo(380, y + 72); ctx.stroke();

    avatar(ctx, 20, y + 12, 48, item.letter, item.isGroup ? '#128C7E' : '#075E54');
    if (item.online) onlineDot(ctx, 20, y + 12, 48);

    ctx.fillStyle = '#111'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(item.name, 80, y + 32);
    ctx.fillStyle = '#667'; ctx.font = '13px sans-serif';
    ctx.fillText(item.msg.substring(0, 35), 80, y + 52);
    ctx.fillStyle = '#999'; ctx.font = '11px sans-serif';
    ctx.textAlign = 'right'; ctx.fillText(item.time, 366, y + 28); ctx.textAlign = 'left';
    y += 72;
  });

  // Right side empty
  ctx.fillStyle = '#f0f2f5'; ctx.fillRect(380, 0, 900, 800);
  ctx.fillStyle = '#999'; ctx.font = '48px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('💬', 830, 360);
  ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#333';
  ctx.fillText('BussUp\'a Hosgeldiniz!', 830, 400);
  ctx.font = '16px sans-serif'; ctx.fillStyle = '#999';
  ctx.fillText('Sohbet baslatmak icin "+ Yeni" butonuna basin', 830, 430);
  ctx.textAlign = 'left';

  fs.writeFileSync(path.join(DIR, '03-sohbet-listesi.png'), c.toBuffer('image/png'));
  console.log('   ✓ 03-sohbet-listesi.png');
}

// ===== 4. NEW CHAT MODAL =====
function drawNewChat() {
  const c = createCanvas(1280, 800);
  const ctx = c.getContext('2d');
  // Dim background
  ctx.fillStyle = '#f0f2f5'; ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, 1280, 800);

  // Modal
  const mx = 430, my = 100, mw = 420, mh = 560;
  ctx.fillStyle = '#fff'; roundRect(ctx, mx, my, mw, mh, 16); ctx.fill();

  ctx.fillStyle = '#075E54'; ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Yeni Sohbet', mx + 28, my + 38);
  ctx.fillStyle = '#666'; ctx.font = '24px sans-serif';
  ctx.fillText('✕', mx + mw - 40, my + 36);

  // Tabs
  ctx.fillStyle = '#075E54'; roundRect(ctx, mx + 28, my + 58, 175, 38, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Bireysel', mx + 28 + 87, my + 82); ctx.textAlign = 'left';

  ctx.strokeStyle = '#075E54'; ctx.lineWidth = 2; roundRect(ctx, mx + 215, my + 58, 175, 38, 8); ctx.stroke();
  ctx.fillStyle = '#075E54'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Grup', mx + 215 + 87, my + 82); ctx.textAlign = 'left';

  // Search
  ctx.fillStyle = '#f0f0f0'; roundRect(ctx, mx + 28, my + 112, mw - 56, 40, 8); ctx.fill();
  ctx.fillStyle = '#aaa'; ctx.font = '14px sans-serif'; ctx.fillText('Kisi ara...', mx + 44, my + 137);

  // User list
  const users = [
    { name: 'Ayse Demir', email: 'ayse@sirket.com', dept: 'Pazarlama', online: true },
    { name: 'Mehmet Kaya', email: 'mehmet@sirket.com', dept: 'Yazilim', online: true },
    { name: 'Zeynep Ozturk', email: 'zeynep@sirket.com', dept: 'Insan Kaynaklari', online: false },
  ];

  let y = my + 168;
  users.forEach(u => {
    avatar(ctx, mx + 28, y, 42, u.name[0]);
    if (u.online) onlineDot(ctx, mx + 28, y, 42);
    ctx.fillStyle = '#111'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(u.name, mx + 82, y + 18);
    ctx.fillStyle = '#666'; ctx.font = '12px sans-serif';
    ctx.fillText(`${u.email} · ${u.dept}`, mx + 82, y + 34);
    y += 62;
  });

  fs.writeFileSync(path.join(DIR, '04-yeni-sohbet.png'), c.toBuffer('image/png'));
  console.log('   ✓ 04-yeni-sohbet.png');
}

// ===== 5. CHAT SCREEN =====
function drawChatScreen() {
  const c = createCanvas(1280, 800);
  const ctx = c.getContext('2d');

  // Sidebar mini
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 380, 800);
  ctx.fillStyle = '#075E54'; ctx.fillRect(0, 0, 380, 64);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('BussUp', 20, 38);

  // Active chat item
  ctx.fillStyle = '#ebebeb'; ctx.fillRect(0, 108, 380, 72);
  avatar(ctx, 20, 120, 48, 'A');
  onlineDot(ctx, 20, 120, 48);
  ctx.fillStyle = '#111'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('Ayse Demir', 80, 144);
  ctx.fillStyle = '#667'; ctx.font = '13px sans-serif'; ctx.fillText('Rica ederim, gorusuruz! 😊', 80, 164);
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(380, 0); ctx.lineTo(380, 800); ctx.stroke();

  // Chat header
  ctx.fillStyle = '#075E54'; ctx.fillRect(380, 0, 900, 64);
  avatar(ctx, 396, 12, 40, 'A', '#128C7E');
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('Ayse Demir', 448, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '12px sans-serif'; ctx.fillText('Cevrimici', 448, 50);

  // Chat BG
  ctx.fillStyle = '#ECE5DD'; ctx.fillRect(380, 64, 900, 670);

  // Messages
  const messages = [
    { mine: true, text: 'Merhaba Ayse! Toplanti icin hazir misin?', time: '14:25' },
    { mine: false, text: 'Merhaba Ali! Evet, sunumu hazirliyorum.', time: '14:26' },
    { mine: true, text: 'Harika! Saat 14:00 de konferans odasinda olalim.', time: '14:27' },
    { mine: false, text: 'Tamam, ben de Mehmet\'i bilgilendireyim.', time: '14:28' },
    { mine: true, text: 'Super, tesekkurler! 🙏', time: '14:30' },
    { mine: false, text: 'Rica ederim, gorusuruz! 😊', time: '14:32' },
  ];

  let y = 100;
  messages.forEach(m => {
    const textW = ctx.measureText(m.text).width;
    const bubbleW = Math.min(Math.max(textW + 30, 120), 500);
    const bx = m.mine ? 1260 - bubbleW : 400;

    ctx.fillStyle = m.mine ? '#DCF8C6' : '#fff';
    roundRect(ctx, bx, y, bubbleW, 52, 10);
    ctx.fill();

    if (!m.mine) {
      ctx.fillStyle = '#075E54'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Ayse Demir', bx + 12, y + 16);
    }

    ctx.fillStyle = '#111'; ctx.font = '14px sans-serif';
    ctx.fillText(m.text, bx + 12, m.mine ? y + 28 : y + 32);

    ctx.fillStyle = m.mine ? '#7a9c78' : '#999'; ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(m.time + (m.mine ? ' ✓✓' : ''), bx + bubbleW - 10, y + 46);
    ctx.textAlign = 'left';

    y += 68;
  });

  // Input area
  ctx.fillStyle = '#f0f0f0'; ctx.fillRect(380, 734, 900, 66);
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(380, 734); ctx.lineTo(1280, 734); ctx.stroke();

  ctx.fillStyle = '#fff'; roundRect(ctx, 396, 745, 800, 44, 20); ctx.fill();
  ctx.fillStyle = '#aaa'; ctx.font = '15px sans-serif'; ctx.fillText('Mesaj yazin...', 416, 773);

  ctx.fillStyle = '#075E54'; ctx.beginPath(); ctx.arc(1228, 767, 22, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('➤', 1228, 774); ctx.textAlign = 'left';

  fs.writeFileSync(path.join(DIR, '05-mesajlasma.png'), c.toBuffer('image/png'));
  console.log('   ✓ 05-mesajlasma.png');
}

// ===== 6. GROUP CREATION =====
function drawGroupCreation() {
  const c = createCanvas(1280, 800);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f0f2f5'; ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, 1280, 800);

  const mx = 430, my = 60, mw = 420, mh = 640;
  ctx.fillStyle = '#fff'; roundRect(ctx, mx, my, mw, mh, 16); ctx.fill();

  ctx.fillStyle = '#075E54'; ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Yeni Sohbet', mx + 28, my + 38);

  // Tabs - Group active
  ctx.strokeStyle = '#075E54'; ctx.lineWidth = 2;
  roundRect(ctx, mx + 28, my + 58, 175, 38, 8); ctx.stroke();
  ctx.fillStyle = '#075E54'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Bireysel', mx + 28 + 87, my + 82); ctx.textAlign = 'left';

  ctx.fillStyle = '#075E54'; roundRect(ctx, mx + 215, my + 58, 175, 38, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Grup', mx + 215 + 87, my + 82); ctx.textAlign = 'left';

  // Group name
  ctx.fillStyle = '#fff'; roundRect(ctx, mx + 28, my + 112, mw - 56, 40, 8); ctx.fill();
  ctx.strokeStyle = '#075E54'; ctx.lineWidth = 1.5; roundRect(ctx, mx + 28, my + 112, mw - 56, 40, 8); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.font = '14px sans-serif'; ctx.fillText('Yazilim Ekibi', mx + 44, my + 137);

  // Selected tags
  const tags = ['Ayse Demir', 'Mehmet Kaya'];
  let tx = mx + 28;
  tags.forEach(t => {
    const tw = ctx.measureText(t).width + 30;
    ctx.fillStyle = '#e8f5e9'; roundRect(ctx, tx, my + 164, tw, 28, 12); ctx.fill();
    ctx.fillStyle = '#075E54'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText(t + ' ✕', tx + 10, my + 182);
    tx += tw + 8;
  });

  // Search
  ctx.fillStyle = '#f0f0f0'; roundRect(ctx, mx + 28, my + 206, mw - 56, 40, 8); ctx.fill();
  ctx.fillStyle = '#aaa'; ctx.font = '14px sans-serif'; ctx.fillText('Kisi ara...', mx + 44, my + 231);

  // Users with checkmarks
  const users = [
    { name: 'Ayse Demir', email: 'ayse@sirket.com', dept: 'Pazarlama', selected: true },
    { name: 'Mehmet Kaya', email: 'mehmet@sirket.com', dept: 'Yazilim', selected: true },
    { name: 'Zeynep Ozturk', email: 'zeynep@sirket.com', dept: 'Insan Kaynaklari', selected: false },
  ];

  let y = my + 262;
  users.forEach(u => {
    if (u.selected) { ctx.fillStyle = '#e8f5e9'; roundRect(ctx, mx + 20, y - 6, mw - 40, 56, 10); ctx.fill(); }
    avatar(ctx, mx + 28, y, 42, u.name[0]);
    ctx.fillStyle = '#111'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(u.name, mx + 82, y + 18);
    ctx.fillStyle = '#666'; ctx.font = '12px sans-serif';
    ctx.fillText(`${u.email} · ${u.dept}`, mx + 82, y + 34);

    // Checkbox
    if (u.selected) {
      ctx.fillStyle = '#075E54'; ctx.beginPath(); ctx.arc(mx + mw - 46, y + 21, 12, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('✓', mx + mw - 46, y + 26); ctx.textAlign = 'left';
    } else {
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx + mw - 46, y + 21, 12, 0, Math.PI*2); ctx.stroke();
    }
    y += 62;
  });

  // Create button
  y += 10;
  ctx.fillStyle = '#075E54'; roundRect(ctx, mx + 28, y, mw - 56, 48, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Grup Olustur', mx + mw/2, y + 30); ctx.textAlign = 'left';

  fs.writeFileSync(path.join(DIR, '06-grup-olusturma.png'), c.toBuffer('image/png'));
  console.log('   ✓ 06-grup-olusturma.png');
}

console.log('\n📸 BussUp Ekran Goruntuleri Olusturuluyor...\n');
drawLogin();
drawRegister();
drawChatList();
drawNewChat();
drawChatScreen();
drawGroupCreation();
console.log('\n✅ Tamamlandi! screenshots/ klasorune kayit edildi.\n');
