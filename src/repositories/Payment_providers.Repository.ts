import { Database } from '../config/dataBase.js';

export class PaymentProvidersRepository {
  // Create new provider
  static async create(providers_name: string) {
    const res = await Database.connection.query(
      `INSERT INTO payment_providers (providers_name)
       VALUES ($1)
       RETURNING *`,
      [providers_name],
    );
    return res.rows[0];
  }

  // Get all providers
  static async getAll() {
    const res = await Database.connection.query(`SELECT * FROM payment_providers ORDER BY id ASC`);
    return res.rows;
  }

  // Get provider by ID
  static async getById(id: number) {
    const res = await Database.connection.query(`SELECT * FROM payment_providers WHERE id = $1`, [
      id,
    ]);
    return res.rows[0];
  }
  // Get provider by name
  static async getByName(providers_name: string) {
    const res = await Database.connection.query(
      `SELECT id, providers_name FROM payment_providers WHERE providers_name = $1`,
      [providers_name],
    );
    return res.rows[0];
  }

  // Update provider
  static async update(id: number, providers_name: string) {
    const res = await Database.connection.query(
      `UPDATE payment_providers
       SET providers_name = $1
       WHERE id = $2
       RETURNING *`,
      [providers_name, id],
    );
    return res.rows[0];
  }

  // Delete provider
  static async delete(id: number) {
    const res = await Database.connection.query(
      `DELETE FROM payment_providers WHERE id = $1 RETURNING *`,
      [id],
    );
    return res.rows[0];
  }
}
