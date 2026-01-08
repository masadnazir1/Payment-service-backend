import fs from 'fs';
import path from 'path';
import type { LogLevel, PaymentLogEntry } from './types.js';

// Extend PaymentLogEntry for full request info
type InternalLogEntry = PaymentLogEntry & {
  level: LogLevel;
  remoteIp?: string;
  domain?: string;
  userAgent?: string;
  headers?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any>;
  cookies?: Record<string, any>;
};

export class FileLogger {
  private static dir = path.resolve(process.cwd(), 'LOGS');

  static {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  // Single file per day
  private static getLogFile() {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return path.join(this.dir, `log-${date}.log`);
  }

  private static write(level: LogLevel, entry: PaymentLogEntry & Partial<InternalLogEntry>) {
    const internalEntry: InternalLogEntry = { ...entry, level };
    fs.appendFileSync(this.getLogFile(), this.format(internalEntry) + '\n\n', 'utf8');
  }

  static info(entry: PaymentLogEntry & Partial<InternalLogEntry>) {
    this.write('INFO', entry);
  }

  static error(entry: PaymentLogEntry & Partial<InternalLogEntry>) {
    this.write('ERROR', entry);
  }

  private static format(entry: InternalLogEntry) {
    const time = new Date(entry.timestamp).toLocaleString();
    const divider = '-'.repeat(100);

    const response = this.pretty(entry.response);
    const error = entry.error ? this.pretty(entry.error) : '-';

    let method: string | undefined = '-',
      pathStr = '-';
    if (entry.action) {
      const parts = entry.action.split(' ');
      if (parts.length >= 2) {
        method = parts[0];
        pathStr = parts.slice(1).join(' ');
      }
    }

    return `[${time}] ${entry.level}
requestId : ${entry.requestId}
controller: ${entry.controller ?? '-'}
method    : ${method}
path      : ${pathStr}
duration  : ${entry.durationMs ?? '-'} ms
remoteIp  : ${entry.remoteIp ?? '-'}
domain    : ${entry.domain ?? '-'}
userAgent : ${entry.userAgent ?? '-'}

headers:
${entry.headers ? this.pretty(entry.headers) : '-'}

query:
${entry.query ? this.pretty(entry.query) : '-'}

body:
${entry.body ? this.pretty(entry.body) : '-'}

cookies:
${entry.cookies ? this.pretty(entry.cookies) : '-'}

response:
${response}

error:
${error}

${divider}`;
  }

  private static pretty(data: any) {
    if (!data) return '-';
    if (typeof data === 'string') {
      try {
        return JSON.stringify(JSON.parse(data), null, 2);
      } catch {
        return data;
      }
    }
    return JSON.stringify(data, null, 2);
  }
}
