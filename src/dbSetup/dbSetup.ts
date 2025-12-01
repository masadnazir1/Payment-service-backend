import { Database } from '../config/dataBase.js';

export async function createTables() {
  try {
    await Database.connection.query('BEGIN');

    // ================================
    // 1. payment_providers
    // ================================
    await Database.connection.query(`
      CREATE TABLE IF NOT EXISTS payment_providers (
        id BIGSERIAL PRIMARY KEY,
        providers_name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // ================================
    // 2. vendor_plans
    // ================================
    await Database.connection.query(`
      CREATE TABLE IF NOT EXISTS vendor_plans (
        id BIGSERIAL PRIMARY KEY,
        vendor_name TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await Database.connection.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_plans_vendor_plan
      ON vendor_plans (vendor_name, plan_name);
    `);

    // ================================
    // 3. payment_customer_profiles
    // ================================
    await Database.connection.query(`
      CREATE TABLE IF NOT EXISTS payment_customer_profiles (
        id BIGSERIAL PRIMARY KEY,
        user_email_id TEXT NOT NULL,
        authorize_customer_profile_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        payment_provider_id BIGINT NULL,
        CONSTRAINT payment_customer_profiles_payment_provider_id_fkey
          FOREIGN KEY (payment_provider_id)
          REFERENCES payment_providers(id)
      );
    `);

    await Database.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_customer_profiles_authorize_id
      ON payment_customer_profiles (authorize_customer_profile_id);
    `);

    await Database.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_customer_profiles_email
      ON payment_customer_profiles (user_email_id);
    `);

    // ================================
    // 4. payment_profiles
    // ================================
    await Database.connection.query(`
      CREATE TABLE IF NOT EXISTS payment_profiles (
        id BIGSERIAL PRIMARY KEY,
        customer_profile_id BIGINT NOT NULL,
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
        created_at TIMESTAMPTZ DEFAULT now(),
        payment_provider_id BIGINT NULL,
        
        CONSTRAINT payment_profiles_customer_profile_id_fkey
          FOREIGN KEY (customer_profile_id)
          REFERENCES payment_customer_profiles(id)
          ON DELETE CASCADE,

        CONSTRAINT payment_profiles_payment_provider_id_fkey
          FOREIGN KEY (payment_provider_id)
          REFERENCES payment_providers(id)
      );
    `);

    await Database.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_profiles_authorize_payment_profile_id
      ON payment_profiles (authorize_payment_profile_id);
    `);

    await Database.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_profiles_card_last4
      ON payment_profiles (card_last4);
    `);

    await Database.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_profiles_customer_profile_id
      ON payment_profiles (customer_profile_id);
    `);

    // ================================
    // 5. payment_transactions
    // ================================
    await Database.connection.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id BIGSERIAL PRIMARY KEY,
        external_user_id TEXT NOT NULL,
        customer_profile_id BIGINT NOT NULL,
        payment_profile_id BIGINT NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        authorize_transaction_id TEXT,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        payment_provider_id BIGINT NULL,

        CONSTRAINT payment_transactions_payment_provider_id_fkey
          FOREIGN KEY (payment_provider_id)
          REFERENCES payment_providers(id)
      );
    `);

    await Database.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at
      ON payment_transactions (created_at);
    `);

    await Database.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_profile_id
      ON payment_transactions (customer_profile_id);
    `);

    await Database.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_external_user_id
      ON payment_transactions (external_user_id);
    `);

    await Database.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_profile_id
      ON payment_transactions (payment_profile_id);
    `);

    await Database.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
      ON payment_transactions (status);
    `);

    await Database.connection.query('COMMIT');

    console.log(' All tables created/verified successfully.');
  } catch (err) {
    await Database.connection.query('ROLLBACK');
    console.error(' Error creating tables:', err);
  }
}

await createTables();
