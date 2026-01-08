import crypto from 'crypto';

export class RequestContext {
  readonly requestId = crypto.randomUUID();
  private readonly start = Date.now();

  duration() {
    return Date.now() - this.start;
  }
}
