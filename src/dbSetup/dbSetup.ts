import { Database } from '../config/dataBase.js';

export async function createTables() {
  try {
    await Database.connection.query('BEGIN');

    // CUSTOMER PROFILES
    await Database.connection.query(`
      CREATE TABLE IF NOT EXISTS payment_customer_profiles (
        id BIGSERIAL PRIMARY KEY,
        user_email_id TEXT NOT NULL,
        authorize_customer_profile_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // PAYMENT PROFILES
    await Database.connection.query(`
      CREATE TABLE IF NOT EXISTS payment_profiles (
        id BIGSERIAL PRIMARY KEY,
        customer_profile_id BIGINT NOT NULL REFERENCES payment_customer_profiles(id) ON DELETE CASCADE,
        authorize_payment_profile_id TEXT NOT NULL,
        card_last4 TEXT,
        card_brand TEXT,
        first_name TEXT,
        last_name TEXT,
        streetNumber TEXT,
        city TEXT,
        state_province TEXT,
        zip_code INT,
        country TEXT,
        phoneNumber TEXT,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // TRANSACTIONS
    await Database.connection.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id BIGSERIAL PRIMARY KEY,
        external_user_id TEXT NOT NULL,
        customer_profile_id BIGINT NOT NULL,
        payment_profile_id BIGINT NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        authorize_transaction_id TEXT,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // VENDOR PLANS
    await Database.connection.query(`
      CREATE TABLE IF NOT EXISTS vendor_plans (
        id BIGSERIAL PRIMARY KEY,
        vendor_name TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await Database.connection.query('COMMIT');
    console.log('All tables created or verified successfully.');
  } catch (err) {
    await Database.connection.query('ROLLBACK');
    console.error('Error creating tables:', err);
  }
}

await createTables();
