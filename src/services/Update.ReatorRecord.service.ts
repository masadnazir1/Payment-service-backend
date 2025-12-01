import axios from 'axios';

export class UpdateRealtorRecordService {
  static API_BASE_URL = 'https://realtoruplift.com/api/payment-profiles';

  /** update the realtor regarding the payment method */
  static async sendPaymentProfile(payload: any) {
    try {
      const response = await axios.post(this.API_BASE_URL, payload);
      return response.data;
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message ||
          err.message ||
          'Request failed In realtoruplift information service',
      );
    }
  }
}
