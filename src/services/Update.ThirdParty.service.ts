import axios from 'axios';

type CallbackSite = 'realtoruplift' | 'zillead';

export class UpdateRealtorRecordService {
  private static API_BASE_URLS: Record<CallbackSite, string> = {
    realtoruplift: 'https://realtoruplift.com/api',
    zillead: 'https://zillead.com/api',
  };

  private static ENDPOINTS = {
    realtoruplift: {
      addMethod: 'payment-profiles',
      updateTransaction: 'payments',
    },
    zillead: {
      addMethod: 'payment-profiles',
      updateTransaction: 'payments/process',
    },
  };

  /** single safe URL builder */
  private static buildUrl(base: string, endpoint: string): string {
    return [base.trim().replace(/\/+$/, ''), endpoint.trim().replace(/^\/+/, '')].join('/');
  }

  /** payment profile */
  static async sendPaymentProfile(payload: any, callbackSite: CallbackSite = 'realtoruplift') {
    const base = this.API_BASE_URLS[callbackSite];
    const endpoint = this.ENDPOINTS[callbackSite].addMethod;
    const url = this.buildUrl(base, endpoint);

    try {
      const response = await axios.post(url, payload);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message ?? err.message ?? 'Thirdparty Request failed');
    }
  }

  /** transaction update */
  static async updateTransactionRecord(payload: any, callbackSite: CallbackSite = 'realtoruplift') {
    const base = this.API_BASE_URLS[callbackSite];
    const endpoint = this.ENDPOINTS[callbackSite].updateTransaction;
    const url = this.buildUrl(base, endpoint);

    try {
      const response = await axios.post(url, payload);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message ?? err.message ?? 'Thirdparty Update Failed');
    }
  }
}
