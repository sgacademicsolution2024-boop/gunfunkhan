export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

export type PaymentMode = "Cash" | "UPI" | "Card";

export type RestaurantSettings = {
  id?: string;
  name: string;
  phone: string;
  address: string;
  gstin: string;
  logoUrl: string;
  taxRate: number;
  serviceChargeRate: number;
  currency: string;
};

export type PosMenuItem = {
  id: string;
  name: string;
  price: number | null;
  category: string;
  stockQty: number;
  minStockQty: number;
  trackStock: boolean;
  isAvailable: boolean;
};

export type Bill = {
  id: string;
  orderId?: string;
  billNumber: number;
  date: string;
  tableNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  gstPercent: number;
  gstAmount: number;
  serviceChargePercent?: number;
  serviceChargeAmount?: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  restaurant?: RestaurantSettings;
  syncStatus?: "synced" | "local";
  syncError?: string;
};
