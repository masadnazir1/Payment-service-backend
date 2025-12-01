import { Database } from '../config/dataBase.js';

export class PaymentTransactionsRepository {
  static async create(
    providers_name: number,
    externalUserId: string,
    customerProfileId: number,
    paymentProfileId: number,
    amount: number,
    authorizeTransactionId: string,
    status: string,
  ) {
    const res = await Database.connection.query(
      `INSERT INTO payment_transactions
       (external_user_id, customer_profile_id, payment_profile_id, amount, authorize_transaction_id, status,payment_provider_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        externalUserId,
        customerProfileId,
        paymentProfileId,
        amount,
        authorizeTransactionId,
        status,
        providers_name,
      ],
    );
    return res.rows[0];
  }
}
