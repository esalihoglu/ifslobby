const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const domainCheck = require('../middleware/domainCheck');
const auth = require('../middleware/auth');

const router = express.Router();

// Kayit
router.post('/register', domainCheck, async (req, res) => {
  try {
    const { email, password, displayName, department, title } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'E-posta, sifre ve gorunen ad zorunludur.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Sifre en az 6 karakter olmalidir.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Bu e-posta adresi zaten kullaniliyor.' });
    }

    const user = new User({ email, password, displayName, department, title });
    await user.save();

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: '30d' });

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Kayit sirasinda bir hata olustu.' });
  }
});

// Giris
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve sifre gerekli.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Gecersiz e-posta veya sifre.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Gecersiz e-posta veya sifre.' });
    }

    user.isOnline = true;
    await user.save();

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: '30d' });

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Giris sirasinda bir hata olustu.' });
  }
});

// Profil guncelle
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['displayName', 'status', 'department', 'title', 'avatar'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Profil guncellenirken hata olustu.' });
  }
});

// Mevcut kullaniciyi getir
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// Cikis
router.post('/logout', auth, async (req, res) => {
  try {
    req.user.isOnline = false;
    req.user.lastSeen = new Date();
    await req.user.save();
    res.json({ message: 'Basariyla cikis yapildi.' });
  } catch (error) {
    res.status(500).json({ error: 'Cikis sirasinda hata olustu.' });
  }
});

module.exports = router;
