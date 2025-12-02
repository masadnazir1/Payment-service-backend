import axios from 'axios';

export class UpdateRealtorRecordService {
  static API_BASE_URL = 'https://realtoruplift.com/api';

  static ENDPOINTS = {
    ADD_METHOD: 'payment-profiles',
    UPDATE_TRANSACTION: 'payments',
  };

  /** update the realtor regarding the payment method */
  static async sendPaymentProfile(payload: any) {
    try {
      const response = await axios.post(
        `${this.API_BASE_URL}/${this.ENDPOINTS.ADD_METHOD}`,
        payload,
      );
      return response.data;
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message ||
          err.message ||
          'Request failed In realtoruplift information service',
      );
    }
  }
  /** update the realtor regarding the transaction */
  static async updateTransactionRecord(payload: any) {
    try {
      const response = await axios.post(
        `${this.API_BASE_URL}/${this.ENDPOINTS.UPDATE_TRANSACTION}`,
        payload,
      );
      return response.data;
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message ||
          err.message ||
          'Update Failed. We could not save the transaction details. Please try again.',
      );
    }
  }
}
