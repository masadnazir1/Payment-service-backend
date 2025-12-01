import { Database } from '../config/dataBase.js';

export class PaymentProfilesRepository {
  static async listByCustomerProfileId(customerProfileId: number) {
    const res = await Database.connection.query(
      `SELECT * FROM payment_profiles WHERE customer_profile_id = $1`,
      [customerProfileId],
    );
    return res.rows;
  }

  static async getById(id: number) {
    const res = await Database.connection.query(`SELECT * FROM payment_profiles WHERE id = $1`, [
      id,
    ]);

    return res.rows[0];
  }
  static async customerProfileId(id: number) {
    const res = await Database.connection.query(
      `SELECT * FROM payment_profiles WHERE customer_profile_id = $1`,
      [id],
    );

    return res.rows[0];
  }

  static async create(
    PaymentProviderId: number,
    customerProfileId: number,
    authorizePaymentProfileId: string,
    cardlast4: string,
    email: string,
    firstName: string,
    lastName: string,
    streetNumber: string,
    city: string,
    zipCode: number,
    country: string,
    phoneNumber: string,
    state?: string,
  ) {
    const res = await Database.connection.query(
      `INSERT INTO payment_profiles (
  customer_profile_id,
  authorize_payment_profile_id,
  card_last4,
  first_name,
  last_name,
  streetNumber,
  city,
  state_province,
  zip_code,
  country,
  phoneNumber,
  email,
  payment_provider_id
)
VALUES (
  $1,  -- customer_profile_id
  $2,  -- authorize_payment_profile_id
  $3,  -- card_last4
  $4,  -- first_name
  $5,  -- last_name
  $6,  -- streetNumber
  $7, -- city
  $8, -- state
  $9, -- zip_code
  $10, -- country
  $11, -- phoneNumber
  $12,  -- email,
  $13 --PaymentProviderId link
)
RETURNING *;

`,
      [
        customerProfileId,
        authorizePaymentProfileId,
        cardlast4,
        firstName,
        lastName,
        streetNumber,
        city,
        state,
        zipCode,
        country,
        phoneNumber,
        email,
        PaymentProviderId,
      ],
    );
    return res.rows[0];
  }
  static async updateProfile(
    PaymentProviderId: number,
    customerProfileId: number,
    authorizePaymentProfileId: string,
    cardlast4: string,
    email: string,
    firstName: string,
    lastName: string,
    streetNumber: string,
    city: string,
    zipCode: number,
    country: string,
    phoneNumber: string,
    state?: string,
  ) {
    const res = await Database.connection.query(
      `UPDATE payment_profiles
     SET
       authorize_payment_profile_id = $1,
       card_last4 = $2,
       first_name = $3,
       last_name = $4,
       streetNumber = $5,
       city = $6,
       state_province = $7,
       zip_code = $8,
       country = $9,
       phoneNumber = $10,
       email = $11,
       payment_provider_id = $12
     WHERE customer_profile_id = $13
     RETURNING *;`,
      [
        authorizePaymentProfileId,
        cardlast4,
        firstName,
        lastName,
        streetNumber,
        city,
        state,
        zipCode,
        country,
        phoneNumber,
        email,
        PaymentProviderId,
        customerProfileId, // WHERE clause
      ],
    );
    return res.rows[0];
  }

  static async delete(id: number) {
    await Database.connection.query(`DELETE FROM payment_profiles WHERE id = $1`, [id]);
  }
}
