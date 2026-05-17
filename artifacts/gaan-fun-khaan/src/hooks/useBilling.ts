import { useState, useCallback, useMemo } from "react";
import type { CartItem, PaymentMode, Bill } from "@/types/billing";
import { saveBill, getNextBillNumber } from "@/lib/storage";

export function useBilling() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discountAmount = useMemo(() => (subtotal * discountPercent) / 100, [subtotal, discountPercent]);
  const afterDiscount = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
  const gstAmount = useMemo(() => (afterDiscount * gstPercent) / 100, [afterDiscount, gstPercent]);
  const grandTotal = useMemo(() => afterDiscount + gstAmount, [afterDiscount, gstAmount]);

  const addToCart = useCallback((item: { id: string; name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prev => prev.filter(c => c.menuItemId !== menuItemId));
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(c => c.menuItemId !== menuItemId));
    } else {
      setCart(prev => prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity } : c));
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountPercent(0);
    setGstPercent(0);
    setPaymentMode("Cash");
  }, []);

  const generateBill = useCallback((): Bill => {
    const billNumber = getNextBillNumber();
    const bill: Bill = {
      id: "GFK-" + String(billNumber).padStart(3, "0"),
      billNumber,
      date: new Date().toISOString(),
      items: cart,
      subtotal,
      discountPercent,
      discountAmount,
      gstPercent,
      gstAmount,
      grandTotal,
      paymentMode,
    };
    saveBill(bill);
    return bill;
  }, [cart, subtotal, discountPercent, discountAmount, gstPercent, gstAmount, grandTotal, paymentMode]);

  return {
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
    discountPercent, setDiscountPercent,
    gstPercent, setGstPercent,
    paymentMode, setPaymentMode,
    subtotal, discountAmount, gstAmount, grandTotal,
    generateBill,
    cartCount: cart.reduce((sum, c) => sum + c.quantity, 0),
  };
}
