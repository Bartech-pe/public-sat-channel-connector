module.exports = {
  development: {
    dialect: 'mysql',
    host: process.env.DB_HOST ?? 'host.docker.internal',
    port: parseInt(process.env.DB_PORT ?? '3307'),
    username: process.env.DB_USER ?? 'edward', // 'bartech'
    password: process.env.DB_PASSWORD ?? '1611', //Bartech[2025]
    database: process.env.DB_NAME ?? 'chatbot',
  },
};
