import { useState } from "react";
import { format } from "date-fns";
import { Download, FileText, MessageCircle, Printer, Send, X } from "lucide-react";
import type { Bill } from "@/types/billing";
import { defaultRestaurantSettings } from "@/lib/posApi";
import { createWhatsAppBillLink } from "@/lib/whatsapp";
import { downloadBillPdf } from "@/lib/downloadBill";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BillModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onNewBill: () => void;
}

export default function BillModal({ bill, isOpen, onClose, onNewBill }: BillModalProps) {
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [phone, setPhone] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  if (!bill) return null;

  const restaurant = bill.restaurant || defaultRestaurantSettings;
  const serviceChargeAmount = bill.serviceChargeAmount || 0;
  const serviceChargePercent = bill.serviceChargePercent || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadError("");
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const result = downloadBillPdf(bill, `bill-${bill.id}.pdf`);
      setPdfUrl(result.url);
      setDownloadError("PDF generated. If the download did not start, use Open PDF below and save it from the browser.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate PDF.";
      setDownloadError(`${message} Please use Print and choose Save as PDF if this browser blocks download.`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleWhatsAppSend = () => {
    const link = createWhatsAppBillLink(phone, bill);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const handleNewBill = () => {
    setShowWhatsApp(false);
    setPhone("");
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl("");
    onNewBill();
    onClose();
  };

  const handleClose = () => {
    setShowWhatsApp(false);
    setPhone("");
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[92dvh] overflow-hidden rounded-xl border-0 bg-white p-0 text-black shadow-2xl sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Bill {bill.id}</DialogTitle>
          <DialogDescription>Receipt for completed order</DialogDescription>
        </DialogHeader>

        <div className="max-h-[62dvh] overflow-y-auto bg-slate-100 p-3 sm:p-5">
          <div id="premium-bill" className="print-receipt-wrapper mx-auto w-full max-w-[420px] bg-white p-5 text-slate-950 shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
              {restaurant.logoUrl && (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                  crossOrigin="anonymous"
                />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black leading-tight tracking-normal">{restaurant.name}</h2>
                {restaurant.address && <p className="mt-1 text-xs leading-snug text-slate-600">{restaurant.address}</p>}
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-600">
                  {restaurant.phone && <span>Phone: {restaurant.phone}</span>}
                  {restaurant.gstin && <span>GSTIN: {restaurant.gstin}</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-dashed border-slate-300 py-4 text-xs">
              <Info label="Invoice" value={bill.id} strong />
              <Info label="Date" value={format(new Date(bill.date), "dd MMM yyyy")} />
              <Info label="Time" value={format(new Date(bill.date), "h:mm a")} />
              {bill.tableNumber && <Info label="Table" value={bill.tableNumber} strong />}
              {bill.customerName && <Info label="Customer" value={bill.customerName} />}
              {bill.customerPhone && <Info label="Customer phone" value={bill.customerPhone} />}
            </div>

            <div className="py-4">
              <div className="grid grid-cols-[1fr_44px_72px] border-b border-slate-200 pb-2 text-[11px] font-black uppercase text-slate-500">
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
              </div>
              <div className="divide-y divide-slate-100">
                {bill.items.map((item) => (
                  <div key={item.menuItemId} className="grid grid-cols-[1fr_44px_72px] gap-2 py-2.5 text-sm">
                    <div>
                      <p className="font-bold leading-tight">{item.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{restaurant.currency} {item.price.toFixed(2)} each</p>
                    </div>
                    <span className="text-center font-bold tabular-nums">{item.quantity}</span>
                    <span className="text-right font-bold tabular-nums">{restaurant.currency} {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-4 text-sm">
              <Amount label="Subtotal" value={bill.subtotal} currency={restaurant.currency} />
              {bill.discountAmount > 0 && (
                <Amount label={`Discount (${bill.discountPercent}%)`} value={-bill.discountAmount} currency={restaurant.currency} tone="success" />
              )}
              {bill.gstAmount > 0 && <Amount label={`GST/Tax (${bill.gstPercent}%)`} value={bill.gstAmount} currency={restaurant.currency} />}
              {serviceChargeAmount > 0 && (
                <Amount label={`Service charge (${serviceChargePercent}%)`} value={serviceChargeAmount} currency={restaurant.currency} />
              )}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-950 px-4 py-3 text-white">
                <span className="text-sm font-black uppercase">Grand total</span>
                <span className="text-xl font-black tabular-nums">{restaurant.currency} {bill.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 text-xs font-bold uppercase text-slate-600">
                <span>Payment method</span>
                <span>{bill.paymentMode}</span>
              </div>
            </div>

            {bill.syncStatus === "local" && bill.syncError && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                Saved locally. Supabase sync needs attention before this bill appears in cloud reports.
              </div>
            )}

            <div className="mt-5 border-t border-dashed border-slate-300 pt-4 text-center">
              <p className="font-black">Thank you for visiting!</p>
              <p className="mt-1 text-xs text-slate-500">Come for the Gaan, Stay for the Khaan!</p>
            </div>
          </div>
        </div>

        {showWhatsApp && (
          <div className="border-t border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                <span className="text-sm font-bold text-gray-800">Send via WhatsApp</span>
              </div>
              <button onClick={() => { setShowWhatsApp(false); setPhone(""); }} className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-black/10">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="Customer phone with country code"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleWhatsAppSend()}
                className="h-10 flex-1 border-[#86efac] bg-white text-sm focus-visible:ring-[#25D366]/30"
                autoFocus
              />
              <button
                onClick={handleWhatsAppSend}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1ebe5d] active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
                Open
              </button>
            </div>
          </div>
        )}

        {downloadError && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {downloadError}
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex rounded-md bg-amber-100 px-2 py-1 font-black text-amber-950 underline"
              >
                Open PDF
              </a>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 border-t bg-white p-4 sm:gap-3">
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleNewBill}>
            <FileText className="mr-2 h-4 w-4" />
            New Bill
          </Button>
          <Button variant="outline" className="w-full border-[#25D366] text-[#25D366] hover:bg-[#f0fdf4] hover:text-[#25D366] sm:w-auto" onClick={() => setShowWhatsApp((value) => !value)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleDownload} disabled={isDownloading}>
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Making PDF" : "PDF"}
          </Button>
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className={`mt-0.5 ${strong ? "font-black" : "font-semibold"}`}>{value}</p>
    </div>
  );
}

function Amount({
  label,
  value,
  currency,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  tone?: "success";
}) {
  return (
    <div className={`flex justify-between ${tone === "success" ? "font-semibold text-emerald-600" : "text-slate-700"}`}>
      <span>{label}</span>
      <span className="font-bold tabular-nums">{value < 0 ? "-" : ""}{currency} {Math.abs(value).toFixed(2)}</span>
    </div>
  );
}
