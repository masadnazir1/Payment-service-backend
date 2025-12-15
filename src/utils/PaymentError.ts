export class PaymentError extends Error {
  public readonly code: number;
  public readonly gatewayCode: string;
  public readonly status: string;
  public readonly transactionId?: string | undefined;

  constructor(
    code: number,
    gatewayCode: string,
    status: string,
    transactionId?: string,
    message = 'Payment failed',
  ) {
    super(message);
    this.name = 'PaymentError';

    this.code = code;
    this.gatewayCode = gatewayCode;
    this.status = status;
    this.transactionId = transactionId;

    //  Fix prototype chain (important)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
