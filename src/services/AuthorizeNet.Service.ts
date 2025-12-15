import pkg, { APIContracts } from 'authorizenet';
import { PaymentError } from '../utils/PaymentError.js';
const { APIControllers } = pkg;

type OpaqueData = { dataDescriptor: string; dataValue: string };

type ExecOptions = {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class AuthorizeNetService {
  // === Configuration helpers ===
  private static isLive(): boolean {
    return process.env.AUTHORIZE_NET_ENVIRONMENT === 'LIVE';
  }

  private static changeTheEnvKeys(PaymentProvider: string) {
    //check the provider and return the right env files
    if (PaymentProvider === 'fabzsolutions' && this.isLive()) {
      return {
        LOGIN_ID: process.env.AUTHORIZE_NET_API_LOGIN_ID_LIVE__FABZ,
        TRANSACTION_ID: process.env.AUTHORIZE_NET_TRANSACTION_KEY_LIVE__FABZ,
      };
    } else if (PaymentProvider === 'fabzsolutions' && !this.isLive()) {
      return {
        LOGIN_ID: process.env.AUTHORIZE_NET_API_LOGIN_ID_TEST,
        TRANSACTION_ID: process.env.AUTHORIZE_NET_TRANSACTION_KEY_TEST,
      };
    }

    //check for carebusinessconsultingsolutions
    if (PaymentProvider === 'carebusinessconsultingsolutions' && this.isLive()) {
      return {
        LOGIN_ID: process.env.AUTHORIZE_NET_API_LOGIN_ID_LIVE__CAREBUZ,
        TRANSACTION_ID: process.env.AUTHORIZE_NET_TRANSACTION_KEY_LIVE__CAREBUZ,
      };
    } else if (PaymentProvider === 'carebusinessconsultingsolutions' && !this.isLive()) {
      return {
        LOGIN_ID: process.env.AUTHORIZE_NET_API_LOGIN_ID_TEST,
        TRANSACTION_ID: process.env.AUTHORIZE_NET_TRANSACTION_KEY_TEST,
      };
    }
  }

  //build the endpoint from contants
  private static endPoint() {
    const env = process.env.AUTHORIZE_ENV;
    if (env === 'production') {
      return 'https://api2.authorize.net/xml/v1/request.api';
    }
    return 'https://apitest.authorize.net/xml/v1/request.api';
  }

  private static getMerchantAuthentication(PaymentProvider: string) {
    const envConfigs = AuthorizeNetService.changeTheEnvKeys(PaymentProvider);

    const merchantAuthentication = new APIContracts.MerchantAuthenticationType();

    if (!envConfigs?.LOGIN_ID || !envConfigs?.TRANSACTION_ID) {
      throw new Error(`Missing API keys for provider: ${PaymentProvider}`);
    }

    merchantAuthentication.setName(envConfigs?.LOGIN_ID);
    merchantAuthentication.setTransactionKey(envConfigs?.TRANSACTION_ID);

    return merchantAuthentication;
  }

  private static getValidationMode(): string {
    // For live, use NONE (do not use TESTMODE in production)
    return this.isLive()
      ? APIContracts.ValidationModeEnum.NONE
      : APIContracts.ValidationModeEnum.TESTMODE;
  }

  // === Small builders ===
  private static buildPaymentTypeFromOpaqueData(opaqueData: OpaqueData): APIContracts.PaymentType {
    const opaque = new APIContracts.OpaqueDataType();
    opaque.setDataDescriptor(opaqueData.dataDescriptor);
    opaque.setDataValue(opaqueData.dataValue); // sensitive: do not log
    const paymentType = new APIContracts.PaymentType();
    paymentType.setOpaqueData(opaque);
    return paymentType;
  }

  private static buildBillTo(updates: {
    firstName?: string;
    lastName?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string | number;
    country?: string;
    phoneNumber?: string;
    email?: string;
  }) {
    const billTo = new APIContracts.CustomerAddressType();
    if (updates.firstName) billTo.setFirstName(updates.firstName);
    if (updates.lastName) billTo.setLastName(updates.lastName);
    if (updates.streetAddress) billTo.setAddress(updates.streetAddress);
    if (updates.city) billTo.setCity(updates.city);
    if (updates.state) billTo.setState(updates.state);
    if (updates.zipCode) billTo.setZip(String(updates.zipCode ?? ''));
    if (updates.country) billTo.setCountry(updates.country);
    if (updates.phoneNumber) billTo.setPhoneNumber(updates.phoneNumber);
    if (updates.email) billTo.setEmail(updates.email);
    return billTo;
  }

  // === Controller executor with timeout + retry ===
  private static async executeController<T = any>(
    controller: any,
    opts: ExecOptions = {},
  ): Promise<T> {
    const timeoutMs = opts.timeoutMs ?? 8_000; // default 8s
    const retries = opts.retries ?? 2;
    const retryDelayMs = opts.retryDelayMs ?? 350;

    let lastErr: any = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // SDK uses callback-based execute; wrap with Promise + timeout
        const result = await new Promise<T>((resolve, reject) => {
          let finished = false;
          const timer = setTimeout(() => {
            if (finished) return;
            finished = true;
            // controller may still call back later - we ignore
            reject(new Error('Authorize.Net call timed out'));
          }, timeoutMs);

          try {
            controller.execute(() => {
              if (finished) return;
              finished = true;
              clearTimeout(timer);
              try {
                const apiResponse = controller.getResponse();
                if (!apiResponse) return reject(new Error('Null response from Authorize.Net'));
                resolve(apiResponse as T);
              } catch (err) {
                reject(err);
              }
            });
          } catch (err) {
            if (!finished) {
              finished = true;
              clearTimeout(timer);
              reject(err);
            }
          }
        });

        return result;
      } catch (err: any) {
        lastErr = err;
        // simple backoff for transient network/gateway errors
        const isRetryable = /timed out|ECONNRESET|EAI_AGAIN|ETIMEDOUT|503|5\d{2}/i.test(
          String(err.message || err),
        );
        if (!isRetryable || attempt === retries) break;
        await sleep(retryDelayMs * (attempt + 1));
      }
    }
    // map lastErr to friendly message
    throw lastErr;
  }

  // === Public API ===

  /**
   * Create Customer Profile using Accept.js opaqueData
   */
  static async createCustomerProfile(
    //
    providers_name: string,
    //
    email: string,
    firstName: string,
    lastName: string,
    streetAddress: string,
    city: string,
    state: string,
    zipCode: string,
    country: string,
    phoneNumber: string,
    opaqueData?: OpaqueData,
  ): Promise<{ customerProfileId: string; paymentProfileId: string | null }> {
    //
    if (!email) throw new Error('email required');
    //
    const merchantAuth = this.getMerchantAuthentication(providers_name);

    const validationMode = this.getValidationMode();

    const profiles: APIContracts.CustomerPaymentProfileType[] = [];
    if (opaqueData) {
      const paymentType = this.buildPaymentTypeFromOpaqueData(opaqueData);
      const customerAddress = this.buildBillTo({
        firstName,
        lastName,
        streetAddress,
        city,
        state,
        zipCode,
        country,
        phoneNumber,
        email,
      });

      const customerPaymentProfile = new APIContracts.CustomerPaymentProfileType();
      customerPaymentProfile.setCustomerType(APIContracts.CustomerTypeEnum.INDIVIDUAL);
      customerPaymentProfile.setPayment(paymentType);
      customerPaymentProfile.setBillTo(customerAddress);
      profiles.push(customerPaymentProfile);
    }

    const customerProfile = new APIContracts.CustomerProfileType();
    const merchantCustomerId = `c${Date.now().toString(36)}${Math.random()
      .toString(36)
      .substring(2, 6)}`.slice(0, 20);
    customerProfile.setMerchantCustomerId(merchantCustomerId);
    customerProfile.setDescription('Primary customer profile');
    customerProfile.setEmail(email);
    if (profiles.length) customerProfile.setPaymentProfiles(profiles);

    const req = new APIContracts.CreateCustomerProfileRequest();
    req.setMerchantAuthentication(merchantAuth);
    req.setProfile(customerProfile);
    req.setValidationMode(validationMode);

    const ctrl = new APIControllers.CreateCustomerProfileController(req.getJSON());

    //set the env
    ctrl.setEnvironment(AuthorizeNetService.endPoint());

    const raw = (await this.executeController<any>(ctrl)) as any;
    const res = new APIContracts.CreateCustomerProfileResponse(raw);

    if (
      res.getMessages() &&
      res.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK
    ) {
      const customerProfileId = res.getCustomerProfileId();
      const list = res.getCustomerPaymentProfileIdList();
      const paymentProfileId = list?.numericString?.[0] || null;
      return { customerProfileId, paymentProfileId };
    }

    const err = res.getMessages()?.getMessage?.()[0];

    throw new Error(err?.getText?.() || 'Failed to create customer profile');
  }

  /**
   * charge a user profile
   */
  static async chargePayment(
    providers_name: string,
    customerProfileId: string,
    paymentProfileId: string,
    amount: number,
    opts?: { refId?: string },
  ): Promise<{ transactionId: string; code: number; transactionStatus: string; message?: string }> {
    if (!customerProfileId || !paymentProfileId) {
      throw new Error('customerProfileId and paymentProfileId required');
    }
    if (!amount || Number(amount) <= 0) throw new Error('invalid amount');

    const merchantAuth = this.getMerchantAuthentication(providers_name);

    const paymentProfile = new APIContracts.PaymentProfile();
    paymentProfile.setPaymentProfileId(paymentProfileId);

    const profileToCharge = new APIContracts.CustomerProfilePaymentType();
    profileToCharge.setCustomerProfileId(customerProfileId);
    profileToCharge.setPaymentProfile(paymentProfile);

    const transactionRequest = new APIContracts.TransactionRequestType();
    transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequest.setProfile(profileToCharge);
    transactionRequest.setAmount(Number(amount));

    const createRequest = new APIContracts.CreateTransactionRequest();
    if (opts?.refId) createRequest.setRefId(opts.refId);
    createRequest.setTransactionRequest(transactionRequest);
    createRequest.setMerchantAuthentication(merchantAuth);

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(AuthorizeNetService.endPoint());

    const raw = (await this.executeController<any>(ctrl)) as any;
    const response = new APIContracts.CreateTransactionResponse(raw);

    // -------- STRICT  LOGIC START (only addition) --------
    const tr = response.getTransactionResponse();

    //check api
    const apiOk = response.getMessages()?.getResultCode() === APIContracts.MessageTypeEnum.OK;

    // Handle general API failure
    if (!apiOk || !tr) {
      // Check for duplicate transaction
      const transactionErrors = tr?.getErrors?.()?.getError?.() ?? [];
      const isDuplicate = transactionErrors.some((e: any) => e.errorCode === '11');

      if (isDuplicate) {
        // Option 1: Treat as successful because it's already processed
        // return {
        //   transactionId: tr.getTransId() || 'DUPLICATE_TRANSACTION',
        //   code: 1,
        //   transactionStatus: 'approved',
        //   message: 'Duplicate transaction detected, already processed.',
        // };

        //  Throw a PaymentError specifically for duplicate
        throw new PaymentError(
          409,
          '11',
          'duplicate',
          tr.getTransId(),
          'Duplicate transaction submitted',
        );
      }

      throw new Error('Invalid payment gateway response');
    }

    const responseCode = tr.getResponseCode();
    const transId = tr.getTransId();

    /**
     * Authorize.Net responseCode meanings
     * 1 = Approved
     * 2 = Declined
     * 3 = Error
     * 4 = Held for Review
     */

    switch (responseCode) {
      case '1':
        return {
          transactionId: transId,
          code: 1,
          transactionStatus: 'approved',
        };

      case '2':
        throw new PaymentError(402, '2', 'declined', transId, 'Transaction declined');

      case '3':
        throw new PaymentError(502, '3', 'error', transId, 'Transaction error');

      case '4':
        throw new PaymentError(202, '4', 'held_for_review', transId, 'Transaction held for review');

      default:
        throw new Error(`Unknown response code: ${responseCode}`);
    }
  }

  /**
   * Update payment profile: update billing and optionally replace card via opaqueData.
   */
  static async updatePaymentProfile(
    PaymentProvider: string,
    customerProfileId: string,
    customerPaymentProfileId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      streetAddress?: string;
      city?: string;
      state?: string;
      zipCode?: string | number;
      country?: string;
      phoneNumber?: string;
      email?: string;
      opaqueData?: OpaqueData;
    },
  ): Promise<{ updated: boolean; message: string }> {
    if (!customerProfileId || !customerPaymentProfileId)
      throw new Error('customerProfileId and customerPaymentProfileId required');

    const merchantAuth = this.getMerchantAuthentication(PaymentProvider);
    const validationMode = this.getValidationMode();

    let paymentType: APIContracts.PaymentType | undefined;
    if (updates.opaqueData) {
      paymentType = this.buildPaymentTypeFromOpaqueData(updates.opaqueData);
    }
    const billTo = this.buildBillTo(
      Object.fromEntries(
        Object.entries({
          firstName: updates?.firstName,
          lastName: updates?.lastName,
          streetAddress: updates?.streetAddress,
          city: updates?.city,
          state: updates?.state,
          zipCode: updates?.zipCode,
          country: updates?.country,
          phoneNumber: updates?.phoneNumber,
          email: updates?.email,
        }).filter(([_, v]) => v !== undefined),
      ) as {
        firstName?: string;
        lastName?: string;
        streetAddress?: string;
        city?: string;
        state?: string;
        zipCode?: string | number;
        country?: string;
        phoneNumber?: string;
        email?: string;
      },
    );

    const paymentProfile = new APIContracts.CustomerPaymentProfileExType();
    paymentProfile.setCustomerPaymentProfileId(customerPaymentProfileId);
    paymentProfile.setBillTo(billTo);
    if (paymentType) paymentProfile.setPayment(paymentType);

    const updateRequest = new APIContracts.UpdateCustomerPaymentProfileRequest();
    updateRequest.setMerchantAuthentication(merchantAuth);
    updateRequest.setCustomerProfileId(customerProfileId);
    updateRequest.setPaymentProfile(paymentProfile);
    updateRequest.setValidationMode(validationMode);

    const controller = new APIControllers.UpdateCustomerPaymentProfileController(
      updateRequest.getJSON(),
    );
    //set the controlller environment
    controller.setEnvironment(AuthorizeNetService.endPoint());
    const raw = (await this.executeController<any>(controller)) as any;
    const response = new APIContracts.UpdateCustomerPaymentProfileResponse(raw);
    const msg = response.getMessages()?.getMessage?.()[0];

    if (
      response.getMessages() &&
      response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK
    ) {
      return { updated: true, message: `Code :${msg?.getCode?.()} and ${msg?.getText?.()}` };
    } else if (response.getMessages() && response.getMessages().getResultCode() === 'Error') {
      return { updated: false, message: `Code :${msg?.getCode?.()} and ${msg?.getText?.()}` };
    }

    // extract detailed error
    const code = msg?.getCode?.();
    const text = msg?.getText?.();

    throw new Error(code ? `${code}: ${text}` : text || 'Transaction failed');
  }

  /**
   * Delete customer profile
   */
  static async deleteCustomerProfile(
    PaymentProvider: string,
    customerProfileId: string,
  ): Promise<{ deleted: boolean }> {
    if (!customerProfileId) throw new Error('customerProfileId required');
    const merchantAuth = this.getMerchantAuthentication(PaymentProvider);

    const req = new APIContracts.DeleteCustomerProfileRequest();
    req.setMerchantAuthentication(merchantAuth);
    req.setCustomerProfileId(customerProfileId);

    const controller = new APIControllers.DeleteCustomerProfileController(req.getJSON());

    //set the env url
    controller.setEnvironment(AuthorizeNetService.endPoint());
    const raw = (await this.executeController<any>(controller)) as any;
    const res = new APIContracts.DeleteCustomerProfileResponse(raw);
    if (
      res.getMessages() &&
      res.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK
    ) {
      return { deleted: true };
    }
    const err = res.getMessages()?.getMessage?.()[0];
    throw new Error(err?.getText?.() || 'Failed to delete customer profile');
  }
}
