export type LogLevel = 'INFO' | 'ERROR';

export interface PaymentLogEntry {
  timestamp: string;
  requestId: string;
  controller: string;
  action: string;
  provider?: string;
  email?: string;
  amount?: number;
  request?: unknown;
  response?: unknown;
  durationMs?: number;
  error?: {
    message: string;
    code?: string | number;
    stack?: string;
  };
}
