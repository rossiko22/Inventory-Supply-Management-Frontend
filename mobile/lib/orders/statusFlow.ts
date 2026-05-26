import type { OrderStatus } from '@/types/api';

// One-step forward transitions. A status with no entry is terminal.
// Mirrors the backend enum order: Requested → Approved → Delivered → Closed.
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  Requested: 'Approved',
  Approved:  'Delivered',
  Delivered: 'Closed',
};

export function nextStatus(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[status] ?? null;
}

export function canAdvance(status: OrderStatus): boolean {
  return NEXT_STATUS[status] !== undefined;
}
