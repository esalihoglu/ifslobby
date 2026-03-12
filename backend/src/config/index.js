require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bussup',
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  companyDomain: process.env.COMPANY_DOMAIN || 'sirket.com',
};
