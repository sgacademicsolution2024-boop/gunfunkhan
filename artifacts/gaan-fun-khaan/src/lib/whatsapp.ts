import { format } from "date-fns";
import type { Bill } from "@/types/billing";
import { defaultRestaurantSettings } from "@/lib/posApi";

export function createWhatsAppBillLink(phone: string, bill: Bill): string {
  const restaurant = bill.restaurant || defaultRestaurantSettings;
  const itemSummary = bill.items
    .map((item) => `${item.name} x${item.quantity} - ${restaurant.currency} ${(item.price * item.quantity).toFixed(2)}`)
    .join("\n");

  const text = [
    `*${restaurant.name}*`,
    restaurant.phone ? `Phone: ${restaurant.phone}` : "",
    "",
    `Bill number: ${bill.id}`,
    `Date: ${format(new Date(bill.date), "dd MMM yyyy, h:mm a")}`,
    "",
    itemSummary,
    "",
    `Grand total: *${restaurant.currency} ${bill.grandTotal.toFixed(2)}*`,
    `Payment: ${bill.paymentMode}`,
    "",
    "Thank you for visiting. Please come again!",
  ]
    .filter(Boolean)
    .join("\n");

  const cleanedPhone = phone.replace(/\D/g, "");
  const target = cleanedPhone.length >= 7 ? cleanedPhone : "";

  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}
