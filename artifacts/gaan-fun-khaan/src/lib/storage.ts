import type { Bill } from "@/types/billing";

const BILLS_KEY = "gfk_bills";
const COUNTER_KEY = "gfk_bill_counter";

export function getBills(): Bill[] {
  try {
    const raw = localStorage.getItem(BILLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBill(bill: Bill): void {
  const bills = getBills();
  bills.unshift(bill);
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

export function clearBills(): void {
  localStorage.removeItem(BILLS_KEY);
  localStorage.removeItem(COUNTER_KEY);
}

export function getNextBillNumber(): number {
  const current = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10);
  const next = current + 1;
  localStorage.setItem(COUNTER_KEY, String(next));
  return next;
}
