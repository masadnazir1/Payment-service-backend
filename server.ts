import 'dotenv/config';
import { App } from './app.js';
import { Database } from './src/config/dataBase.js';
import { registerRoutes } from './src/routes/index.js';

await Database.connect();

// create tables if not exists
// await createTables();

const app = new App();
const APP_PORT = process.env.APP_PORT || 9440;

// Mount all routes under /api/v1
registerRoutes(app.app, '/api/v1');

app.app.listen(APP_PORT, () => {
  console.log(`payment-service-backend running at ${APP_PORT}`);
});
