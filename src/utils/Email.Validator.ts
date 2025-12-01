export class EmailValidator {
  static isValid(value: string): boolean {
    if (!value) return false;
    if (typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    const pattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    return pattern.test(normalized);
  }
}
