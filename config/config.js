// config.js
const dotenv = require('dotenv');
dotenv.config();

function getEnv(name) {
  const value = process.env[name];
  return value;
}

module.exports = {
  development: {
    dialect: getEnv('DB_DIALECT'),
    host: getEnv('DB_HOST'),
    port: parseInt(getEnv('DB_PORT')),
    username: getEnv('DB_USER'),
    password: getEnv('DB_PASS'),
    database: getEnv('DB_NAME'),
    dialectOptions: {
      connectTimeout: 200000, // 20 segundos
    },
  },
};
