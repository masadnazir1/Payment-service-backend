import type { Response } from 'express';
import { CustomerProfilesRepository } from '../repositories/CustomerProfiles.Repository.js';
import { PaymentProvidersRepository } from '../repositories/Payment_providers.Repository.js';
import { PaymentProfilesRepository } from '../repositories/PaymentProfiles.Repository.js';
import { PaymentTransactionsRepository } from '../repositories/PaymentTransactions.Repository.js';
import { AuthorizeNetService } from '../services/AuthorizeNet.Service.js';
import { UpdateRealtorRecordService } from '../services/Update.ReatorRecord.service.js';
import type { AuthRequest } from '../types/express.js';
import { EmailValidator } from '../utils/Email.Validator.js';
import { PaymentError } from '../utils/PaymentError.js';
import { ResponseHandler } from '../utils/ResponseHandler.js';

export class PaymentsController {
  // List all payment methods for an external user
  async list(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;
      if (!email) return ResponseHandler.error(res, 'Missing user_email_id from body', 400);

      if (!EmailValidator.isValid(email)) {
        return ResponseHandler.error(res, 'invalid email', 400);
      }

      const customerProfile = await CustomerProfilesRepository.getByUserEmailId(email);
      if (!customerProfile)
        return ResponseHandler.success(res, [], `No payment methods found for ${email}`);

      const payments = await PaymentProfilesRepository.listByCustomerProfileId(customerProfile.id);
      return ResponseHandler.success(res, payments, 'Payments fetched successfully');
    } catch (err: any) {
      return ResponseHandler.error(res, err.message || 'Failed to fetch payments');
    }
  }

  // Add a new payment method
  async addPaymentMethod(req: AuthRequest, res: Response) {
    try {
      const {
        payment_provider,
        email,
        firstName,
        lastName,
        streetNumber,
        city,
        state,
        zipCode,
        country,
        phoneNumber,
        opaqueData,
        cardlast4,
      } = req.body;

      //newCustomerProfile
      let newCustomerProfile = null;
      //
      if (!email) return ResponseHandler.error(res, 'Missing email from body', 400);
      // Ensure customer profile exists
      let customerProfile = await CustomerProfilesRepository.getByUserEmailIdMap(email);
      //check for provider
      let checkProvider = await PaymentProvidersRepository.getByName(payment_provider);

      //
      //make the vars for providers
      const PaymentProvider = checkProvider?.providers_name;
      const PaymentProviderId = checkProvider?.id;

      //
      if (!checkProvider) {
        return ResponseHandler.error(
          res,
          'This payment provider is not currently set up in our system.',
          400,
        );
      }
      //

      //
      if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
        return ResponseHandler.error(res, 'Missing payment token', 400);
      }

      //Validate email
      if (!EmailValidator.isValid(email)) {
        return ResponseHandler.error(res, 'invalid email', 400);
      }

      if (customerProfile?.ProviderIds.includes(PaymentProviderId)) {
        return ResponseHandler.error(
          res,
          'We could not create a new customer profile because one already exists with this payment provider. You can use the existing profile to continue.',
          409,
        );
      }

      let authNetProfile: any = {};

      // Check if this ID exists in the customer profiles
      const existing = customerProfile?.ProviderIds.some(
        (profile) => profile.payment_provider_id === PaymentProviderId,
      );

      if (!customerProfile?.Response || !existing) {
        authNetProfile = await AuthorizeNetService.createCustomerProfile(
          PaymentProvider,
          email,
          firstName,
          lastName,
          streetNumber,
          city,
          state,
          zipCode,
          country,
          phoneNumber,
          opaqueData,
        );

        if (!authNetProfile?.customerProfileId) {
          return ResponseHandler.error(
            res,
            'Failed to create customer profile in Authorize.Net',
            500,
          );
        }

        newCustomerProfile = await CustomerProfilesRepository.create(
          PaymentProviderId,
          email,
          authNetProfile.customerProfileId,
        );
      }

      // If paymentProfileId throw error
      let paymentProfileId = authNetProfile.paymentProfileId;

      if (!paymentProfileId) {
        return ResponseHandler.error(res, 'Failed to create payment profile in Authorize.Net', 500);
      }

      let paymentProfileIdValue = paymentProfileId.toString();

      // Persist payment profile in DB

      const paymentProfile = await PaymentProfilesRepository.create(
        PaymentProviderId,
        newCustomerProfile.id,
        paymentProfileIdValue,
        cardlast4,
        email,
        firstName,
        lastName,
        streetNumber,
        city,
        zipCode,
        country,
        phoneNumber,
        state,
      );

      //realtorUplift service payload
      const payload = {
        data: {
          customer_profile_id: authNetProfile?.customerProfileId,
          authorize_payment_profile_id: paymentProfileIdValue,
          card_last4: paymentProfile?.card_last4,
          card_brand: paymentProfile?.card_brand || 'Visa',
          exp_month: null,
          exp_year: null,
          first_name: paymentProfile?.first_name,
          last_name: paymentProfile?.last_name,
          email: paymentProfile?.email,
          streetnumber: paymentProfile?.streetnumber,
          city: paymentProfile?.city,
          state_province: paymentProfile?.state_province,
          zip_code: paymentProfile?.zip_code ? String(paymentProfile.zip_code) : null,
          country: paymentProfile?.country,
          phonenumber: paymentProfile?.phonenumber ? String(paymentProfile.phonenumber) : null,
          created_at: paymentProfile?.created_at ? String(paymentProfile.created_at) : null,
        },
      };

      // //call the realtorUplift service now
      await UpdateRealtorRecordService.sendPaymentProfile(payload);

      return ResponseHandler.success(
        res,
        paymentProfile,
        'Payment profile successfully created',
        201,
      );
    } catch (err: any) {
      return ResponseHandler.error(res, err.message || err || 'Failed to add payment method');
    }
  }

  // Charge a payment profile
  // Charge a payment profile
  async charge(req: AuthRequest, res: Response) {
    // 🔹 Hoisted vars for catch scope
    let PaymentProviderId: number | undefined;
    let customerProfile: any;
    let paymentProfile: any;

    try {
      const { payment_provider, amount, email } = req.body;

      //check the email
      if (!email || !amount || !payment_provider)
        return ResponseHandler.error(
          res,
          'Missing user email ,providers_name or amount from request body',
          400,
        );

      if (!EmailValidator.isValid(email)) {
        return ResponseHandler.error(res, 'invalid email', 400);
      }

      //check for provider
      const checkProvider = await PaymentProvidersRepository.getByName(payment_provider);

      //make the vars for providers
      const PaymentProvider = checkProvider?.providers_name;
      PaymentProviderId = checkProvider?.id;

      if (!checkProvider || !PaymentProviderId) {
        return ResponseHandler.error(
          res,
          'Missing payment_provider or invalid payment_provider requested',
          400,
        );
      }

      //validation to the charging amount
      if (amount === undefined || amount === null)
        return ResponseHandler.error(res, 'amount required', 400);

      if (Number.isNaN(Number(amount)))
        return ResponseHandler.error(res, 'amount must be numeric', 400);

      if (Number(amount) < 1) return ResponseHandler.error(res, 'amount must be >= 1', 400);

      customerProfile = await CustomerProfilesRepository.getByUserEmailIdMap(email);

      if (!customerProfile) return ResponseHandler.error(res, 'Customer profile not found', 404);

      paymentProfile = await PaymentProfilesRepository.customerProfileId(
        customerProfile?.Response?.id,
      );

      if (!paymentProfile) return ResponseHandler.error(res, 'Payment profile not found', 404);

      // Find if a profile already exists for the requested payment provider
      const findCorrectId = customerProfile?.ProviderIds?.find(
        (id: number) => id === PaymentProviderId,
      );

      if (checkProvider?.id !== findCorrectId) {
        return ResponseHandler.error(
          res,
          'This customer is not registered under the selected payment provider.',
          400,
        );
      }

      const result = await AuthorizeNetService.chargePayment(
        PaymentProvider,
        customerProfile.Response?.authorize_customer_profile_id,
        paymentProfile.authorize_payment_profile_id,
        Number(amount),
      );

      const transaction = await PaymentTransactionsRepository.create(
        PaymentProviderId,
        email,
        customerProfile.Response?.id,
        paymentProfile.id,
        Number(amount),
        result.transactionId,
        result.transactionStatus,
      );

      //realtorUplift service payload
      const payload = {
        first_name: paymentProfile?.first_name,
        last_name: paymentProfile?.last_name,
        email: paymentProfile?.email,
        paid_amount: amount,
        payment_date: new Date(Date.now()).toString(),
        notes: `TRX_ID ${result?.transactionId}`,
      };

      //udpate the trx info on realtoruplift
      try {
        await UpdateRealtorRecordService.updateTransactionRecord(payload);
      } catch (error) {
        console.error('RealtorUplift update failed:', error);
      }

      return ResponseHandler.success(res, transaction, 'Charge successful');
    } catch (err: any) {
      if (err instanceof PaymentError && err.gatewayCode === '11') {
        // Handle duplicate transaction
        return ResponseHandler.error(res, 'Duplicate transaction already submitted', 409);
      }

      //  Handle known payment failures (declined / error / held)
      if (err instanceof PaymentError) {
        await PaymentTransactionsRepository.create(
          PaymentProviderId!,
          req.body.email,
          customerProfile?.Response?.id ?? null,
          paymentProfile?.id ?? null,
          Number(req.body.amount),
          err.transactionId ?? 'GATEWAY_NO_TRANSACTION_ID',
          err.status, // declined | error | held_for_review
        );

        return ResponseHandler.error(res, err.message, err.code);
      }

      //  Unexpected system / gateway crash
      console.error('Payment crash:', err);

      return ResponseHandler.error(res, err.message || 'The transaction was unsuccessful.', 500);
    }
  }

  // Update customer payment method (card + billing)
  async updatePaymentMethod(req: AuthRequest, res: Response) {
    try {
      //
      const {
        payment_provider,
        email,
        cardlast4,
        firstName,
        lastName,
        streetAddress,
        city,
        state,
        zipCode,
        country,
        phoneNumber,
        opaqueData,
      } = req.body;

      if (!email || !firstName || !lastName || !payment_provider)
        return ResponseHandler.error(res, 'email,firstName,providers_name, lastName required', 400);

      //validate the email
      if (!EmailValidator.isValid(email)) {
        return ResponseHandler.error(res, 'invalid email', 400);
      }

      if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
        return ResponseHandler.error(res, 'Missing payment token', 400);
      }

      //check for provider
      let checkProvider = await PaymentProvidersRepository.getByName(payment_provider);

      //

      //make the vars for providers
      const PaymentProvider = checkProvider?.providers_name;
      const PaymentProviderId = checkProvider?.id;

      //
      if (!checkProvider) {
        return ResponseHandler.error(
          res,
          'Missing payment_provider or invalid payment_provider requested',
          400,
        );
      }

      const customerProfile = await CustomerProfilesRepository.getByUserEmailIdMap(email);
      //
      if (!customerProfile) return ResponseHandler.error(res, 'Customer profile not found', 404);

      const paymentProfile = await PaymentProfilesRepository.customerProfileId(
        customerProfile?.Response?.id,
      );

      if (!paymentProfile) return ResponseHandler.error(res, 'Payment profile not found', 404);

      //
      const findCorrectId = customerProfile?.ProviderIds?.find((id) => id === PaymentProviderId);
      //
      if (checkProvider?.id !== findCorrectId) {
        return ResponseHandler.error(
          res,
          'This customer is not registered under the selected payment provider.',
          400,
        );
      }
      //
      const updated = await AuthorizeNetService.updatePaymentProfile(
        PaymentProvider,
        customerProfile?.Response?.authorize_customer_profile_id,
        paymentProfile.authorize_payment_profile_id,
        {
          firstName,
          lastName,
          streetAddress,
          city,
          state,
          zipCode,
          country,
          phoneNumber,
          email,
          opaqueData,
        },
      );

      if (!updated?.updated) return ResponseHandler.error(res, updated?.message, 400);

      // Persist payment profile in DB
      const UpdatePaymentProfile = await PaymentProfilesRepository.updateProfile(
        PaymentProviderId,
        customerProfile?.Response?.id,
        paymentProfile.authorize_payment_profile_id,
        cardlast4,
        email,
        firstName,
        lastName,
        streetAddress || paymentProfile?.streetnumber,
        city,
        zipCode,
        country,
        phoneNumber,
        state,
      );

      return ResponseHandler.success(
        res,
        UpdatePaymentProfile,
        'Payment method updated successfully',
      );
    } catch (err: any) {
      return ResponseHandler.error(res, err || 'Failed to update payment method');
    }
  }
  // Delete a payment profile
  async deletePaymentMethod(req: AuthRequest, res: Response) {
    try {
      const { payment_provider, email } = req.body;

      const customerProfile = await CustomerProfilesRepository.getByUserEmailIdMap(email);

      //check for provider
      let checkProvider = await PaymentProvidersRepository.getByName(payment_provider);

      //make the vars for providers
      const PaymentProvider = checkProvider?.providers_name;
      const PaymentProviderId = checkProvider?.id;

      //
      if (!checkProvider) {
        return ResponseHandler.error(
          res,
          'This payment provider is not currently set up in our system.',
          400,
        );
      }
      //

      if (!customerProfile) return ResponseHandler.error(res, 'Customer Profile not found', 404);

      const findCorrectId = customerProfile?.ProviderIds?.find((id) => id === PaymentProviderId);

      //
      if (checkProvider?.id !== findCorrectId) {
        return ResponseHandler.error(
          res,
          'This customer is not registered under the selected payment provider.',
          400,
        );
      }
      //

      const deleteResponse = await AuthorizeNetService.deleteCustomerProfile(
        PaymentProvider,
        customerProfile?.Response?.authorize_customer_profile_id,
      );

      // Optional: delete local db records
      await CustomerProfilesRepository.deleteByUserEmailId(email, PaymentProviderId);

      if (deleteResponse.deleted) {
        return ResponseHandler.success(res, null, `Payment method ${email} deleted successfully`);
      }
    } catch (err: any) {
      return ResponseHandler.error(res, err.message || err || 'Failed to delete payment method');
    }
  }
}
