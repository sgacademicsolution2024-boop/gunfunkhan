export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

export type PaymentMode = "Cash" | "UPI" | "Card";

export type Bill = {
  id: string;
  billNumber: number;
  date: string;
  tableNumber: string;
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  paymentMode: PaymentMode;
};
