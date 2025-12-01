import { Database } from '../config/dataBase.js';

export class VendorPlansRepository {
  static async listAll() {
    const res = await Database.connection.query(
      `SELECT * FROM vendor_plans ORDER BY created_at DESC`,
    );
    return res.rows;
  }

  static async getById(id: number) {
    const res = await Database.connection.query(`SELECT * FROM vendor_plans WHERE id = $1`, [id]);
    return res.rows[0];
  }
  static async getByPlanName(plan_name: string) {
    const res = await Database.connection.query(`SELECT * FROM vendor_plans WHERE plan_name = $1`, [
      plan_name,
    ]);
    return res.rows[0];
  }
  static async getByVendor(plan_name: string) {
    const res = await Database.connection.query(
      `SELECT * FROM vendor_plans WHERE vendor_name = $1`,
      [plan_name],
    );
    return res.rows[0];
  }

  static async create(vendorName: string, planName: string, price: number) {
    const res = await Database.connection.query(
      `INSERT INTO vendor_plans (
        vendor_name,
        plan_name,
        price
      ) VALUES (
        $1, $2, $3
      ) RETURNING *`,
      [vendorName, planName, price],
    );
    return res.rows[0];
  }

  static async update(id: number, vendorName?: string, planName?: string, price?: number) {
    const current = await this.getById(id);
    if (!current) throw new Error('Vendor plan not found');

    const res = await Database.connection.query(
      `UPDATE vendor_plans
       SET vendor_name = $1,
           plan_name = $2,
           price = $3
       WHERE id = $4
       RETURNING *`,
      [
        vendorName ?? current.vendor_name,
        planName ?? current.plan_name,
        price ?? current.price,
        id,
      ],
    );
    return res.rows[0];
  }

  static async delete(vendorName: string, planName: string) {
    await Database.connection.query(
      `DELETE FROM vendor_plans WHERE vendor_name = $1 AND plan_name =$2`,
      [vendorName, planName],
    );
  }

  static async hasPlan(vendorName: string, planName: string): Promise<boolean> {
    const result = await Database.connection.query(
      `SELECT 1
     FROM vendor_plans
     WHERE vendor_name = $1
       AND plan_name = $2
     LIMIT 1`,
      [vendorName, planName],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
