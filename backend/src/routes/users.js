const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// Sirket kullanicilarini listele
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    const query = { _id: { $ne: req.user._id } };

    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ displayName: 1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Kullanicilar getirilirken hata olustu.' });
  }
});

// Kullanici detayi
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Kullanici bulunamadi.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Kullanici getirilirken hata olustu.' });
  }
});

module.exports = router;
