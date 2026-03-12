const config = require('../config');

const domainCheck = (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ error: 'E-posta adresi gerekli.' });
  }

  const domain = email.split('@')[1];
  if (!domain || domain.toLowerCase() !== config.companyDomain.toLowerCase()) {
    return res.status(403).json({
      error: `Sadece @${config.companyDomain} uzantili e-posta adresleri ile kayit olunabilir.`,
    });
  }

  next();
};

module.exports = domainCheck;
