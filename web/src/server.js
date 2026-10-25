const app = require('./app');
const env = require('./config/env');
const { initDatabase } = require('./config/db');

initDatabase().then(() => {
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Library app listening on port ${env.PORT} -> http://localhost:${env.PORT}`);
  });
});
