import { format } from "date-fns";
import jsPDF from "jspdf";
import type { Bill } from "@/types/billing";
import { defaultRestaurantSettings } from "@/lib/posApi";

function money(currency: string, value: number): string {
  return `${currency} ${value.toFixed(2)}`;
}

function addWrappedText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 5): number {
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export type BillPdfResult = {
  fileName: string;
  url: string;
};

export function downloadBillPdf(bill: Bill, fileName: string): BillPdfResult {
  const restaurant = bill.restaurant || defaultRestaurantSettings;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(restaurant.name, pageWidth / 2, y, { align: "center" });
  y += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  if (restaurant.address) y = addWrappedText(pdf, restaurant.address, margin, y, contentWidth, 4);
  const contact = [restaurant.phone && `Phone: ${restaurant.phone}`, restaurant.gstin && `GSTIN: ${restaurant.gstin}`]
    .filter(Boolean)
    .join("   ");
  if (contact) {
    pdf.text(contact, pageWidth / 2, y, { align: "center" });
    y += 6;
  }

  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Invoice: ${bill.id}`, margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(format(new Date(bill.date), "dd MMM yyyy, h:mm a"), pageWidth - margin, y, { align: "right" });
  y += 6;

  if (bill.tableNumber || bill.customerName || bill.customerPhone) {
    const details = [
      bill.tableNumber && `Table: ${bill.tableNumber}`,
      bill.customerName && `Customer: ${bill.customerName}`,
      bill.customerPhone && `Phone: ${bill.customerPhone}`,
    ]
      .filter(Boolean)
      .join("   ");
    y = addWrappedText(pdf, details, margin, y, contentWidth, 4);
    y += 2;
  }

  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 7;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("ITEM", margin, y);
  pdf.text("QTY", pageWidth - margin - 34, y, { align: "right" });
  pdf.text("TOTAL", pageWidth - margin, y, { align: "right" });
  y += 3;
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  bill.items.forEach((item) => {
    if (y > 260) {
      pdf.addPage();
      y = 16;
    }

    const itemTotal = item.price * item.quantity;
    const itemLines = pdf.splitTextToSize(item.name, contentWidth - 58);
    pdf.setFont("helvetica", "bold");
    pdf.text(itemLines, margin, y);
    pdf.text(String(item.quantity), pageWidth - margin - 34, y, { align: "right" });
    pdf.text(money(restaurant.currency, itemTotal), pageWidth - margin, y, { align: "right" });
    y += itemLines.length * 5;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${money(restaurant.currency, item.price)} each`, margin, y);
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(10);
    y += 6;
  });

  y += 2;
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  const rows: Array<[string, number, boolean?]> = [
    ["Subtotal", bill.subtotal],
  ];
  if (bill.discountAmount > 0) rows.push([`Discount (${bill.discountPercent}%)`, -bill.discountAmount, true]);
  if (bill.gstAmount > 0) rows.push([`GST/Tax (${bill.gstPercent}%)`, bill.gstAmount]);
  if ((bill.serviceChargeAmount || 0) > 0) rows.push([`Service (${bill.serviceChargePercent || 0}%)`, bill.serviceChargeAmount || 0]);

  rows.forEach(([label, value, positive]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(positive ? 5 : 15, positive ? 150 : 23, positive ? 105 : 42);
    pdf.text(label, margin, y);
    pdf.text(`${value < 0 ? "-" : ""}${money(restaurant.currency, Math.abs(value))}`, pageWidth - margin, y, { align: "right" });
    y += 6;
  });

  y += 2;
  pdf.setFillColor(15, 23, 42);
  pdf.roundedRect(margin, y - 5, contentWidth, 12, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text("GRAND TOTAL", margin + 5, y + 2);
  pdf.text(money(restaurant.currency, bill.grandTotal), pageWidth - margin - 5, y + 2, { align: "right" });
  y += 16;

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(10);
  pdf.text(`Payment method: ${bill.paymentMode}`, margin, y);
  y += 12;

  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Thank you for visiting!", pageWidth / 2, y, { align: "center" });
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text("Come for the Gaan, Stay for the Khaan!", pageWidth / 2, y, { align: "center" });

  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  return { fileName, url };
}
