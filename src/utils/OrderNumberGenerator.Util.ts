export function generateOrderNumber(planPrice: number): string {
  const random = Math.floor(10 + Math.random() * 90); // 2-digit random
  return `INV-${planPrice}${random}`;
}
