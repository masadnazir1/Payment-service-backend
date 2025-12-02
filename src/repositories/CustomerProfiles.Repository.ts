import { Database } from '../config/dataBase.js';

export class CustomerProfilesRepository {
  static async getByUserEmailId(externalUserId: string) {
    const res = await Database.connection.query(
      `SELECT * FROM payment_customer_profiles WHERE user_email_id = $1 LIMIT 1`,
      [externalUserId],
    );
    return res.rows[0];
  }
  static async getByUserEmailIdMap(externalUserId: string) {
    const res = await Database.connection.query(
      `SELECT * FROM payment_customer_profiles WHERE user_email_id = $1`,
      [externalUserId],
    );

    // Map payment_provider_id into a new array of numbers
    const paymentProviderIds = res.rows.map((item) => item.payment_provider_id);

    return {
      ProviderIds: paymentProviderIds,
      Response: res.rows[0],
    };
  }

  //create record
  static async create(
    PaymentProviderId: number,
    user_email_id: string,
    authorizeCustomerProfileId: string,
  ) {
    const res = await Database.connection.query(
      `INSERT INTO payment_customer_profiles (user_email_id, authorize_customer_profile_id,payment_provider_id)
       VALUES ($1, $2,$3) RETURNING *`,
      [user_email_id, authorizeCustomerProfileId, PaymentProviderId],
    );
    return res.rows[0];
  }

  static async getById(id: number) {
    const res = await Database.connection.query(
      `SELECT * FROM payment_customer_profiles WHERE id = $1`,
      [id],
    );
    return res.rows[0];
  }

  //
  static async deleteByUserEmailId(user_email_id: string, PaymentProviderId: number) {
    const res = await Database.connection.query(
      `DELETE FROM payment_customer_profiles WHERE user_email_id = $1 and payment_provider_id = $2`,
      [user_email_id, PaymentProviderId],
    );
    return res.rows[0];
  }
}
