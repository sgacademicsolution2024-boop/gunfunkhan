import { useState, useCallback, useEffect, useMemo } from "react";
import type { CartItem, PaymentMode, Bill, RestaurantSettings } from "@/types/billing";
import { saveBill, getNextBillNumber } from "@/lib/storage";
import { saveOrder } from "@/lib/posApi";

export function useBilling(restaurant?: RestaurantSettings | null) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [gstPercent, setGstPercent] = useState(() => restaurant?.taxRate ?? 0);
  const [serviceChargePercent, setServiceChargePercent] = useState(() => restaurant?.serviceChargeRate ?? 0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");

  useEffect(() => {
    setGstPercent(restaurant?.taxRate ?? 0);
    setServiceChargePercent(restaurant?.serviceChargeRate ?? 0);
  }, [restaurant?.taxRate, restaurant?.serviceChargeRate]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discountAmount = useMemo(() => (subtotal * discountPercent) / 100, [subtotal, discountPercent]);
  const afterDiscount = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
  const gstAmount = useMemo(() => (afterDiscount * gstPercent) / 100, [afterDiscount, gstPercent]);
  const serviceChargeAmount = useMemo(
    () => (afterDiscount * serviceChargePercent) / 100,
    [afterDiscount, serviceChargePercent],
  );
  const grandTotal = useMemo(
    () => afterDiscount + gstAmount + serviceChargeAmount,
    [afterDiscount, gstAmount, serviceChargeAmount],
  );

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
    setTableNumber("");
    setCustomerName("");
    setCustomerPhone("");
    setDiscountPercent(0);
    setGstPercent(restaurant?.taxRate ?? 0);
    setServiceChargePercent(restaurant?.serviceChargeRate ?? 0);
    setPaymentMode("Cash");
  }, [restaurant?.taxRate, restaurant?.serviceChargeRate]);

  const generateBill = useCallback(async (): Promise<Bill> => {
    const billNumber = getNextBillNumber();
    const bill: Bill = {
      id: "GFK-" + String(billNumber).padStart(3, "0"),
      billNumber,
      date: new Date().toISOString(),
      tableNumber,
      customerName,
      customerPhone,
      items: cart,
      subtotal,
      discountPercent,
      discountAmount,
      gstPercent,
      gstAmount,
      serviceChargePercent,
      serviceChargeAmount,
      grandTotal,
      paymentMode,
      restaurant: restaurant || undefined,
      syncStatus: "local",
    };

    try {
      const syncedBill = restaurant?.id ? await saveOrder(restaurant.id, bill) : bill;
      saveBill(syncedBill);
      return syncedBill;
    } catch (error) {
      const syncError = error instanceof Error ? error.message : "Supabase order save failed.";
      const localBill: Bill = {
        ...bill,
        syncStatus: "local",
        syncError,
      };
      saveBill(localBill);
      return localBill;
    }
  }, [
    cart,
    tableNumber,
    customerName,
    customerPhone,
    subtotal,
    discountPercent,
    discountAmount,
    gstPercent,
    gstAmount,
    serviceChargePercent,
    serviceChargeAmount,
    grandTotal,
    paymentMode,
    restaurant,
  ]);

  return {
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
    tableNumber, setTableNumber,
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    discountPercent, setDiscountPercent,
    gstPercent, setGstPercent,
    serviceChargePercent, setServiceChargePercent,
    paymentMode, setPaymentMode,
    subtotal, discountAmount, gstAmount, serviceChargeAmount, grandTotal,
    generateBill,
    cartCount: cart.reduce((sum, c) => sum + c.quantity, 0),
  };
}
