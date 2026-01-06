import { Pool } from 'pg';

export class Database {
  private static instance: Pool;

  static get connection(): Pool {
    if (!Database.instance) {
      Database.instance = new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        max: 10,
        idleTimeoutMillis: 3000000,
        connectionTimeoutMillis: 5000,
      });
    }
    return Database.instance;
  }

  static async connect(): Promise<void> {
    const client = await Database.connection.connect();
    console.log('Database connected successfully!');
    await client.query('SELECT 1');
    client.release();
  }
}
