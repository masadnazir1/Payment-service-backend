export function generateInvoiceNumber(userId: number | string): string {
  const random = Math.floor(10 + Math.random() * 90); // 2-digit random
  return `INV-${userId}${random}`;
}
