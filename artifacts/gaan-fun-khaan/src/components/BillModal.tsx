import { format } from "date-fns";
import type { Bill } from "@/types/billing";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";

interface BillModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onNewBill: () => void;
}

export default function BillModal({ bill, isOpen, onClose, onNewBill }: BillModalProps) {
  if (!bill) return null;

  const handlePrint = () => {
    const receiptEl = document.querySelector(".print-receipt-wrapper");
    if (!receiptEl) return;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bill GFK-${String(bill.billNumber).padStart(3, "0")}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 80mm;
      background: white;
      color: black;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.5;
    }
    body { padding: 4mm; }
    .text-center  { text-align: center; }
    .text-right   { text-align: right; }
    .text-left    { text-align: left; }
    .font-bold    { font-weight: bold; }
    .font-mono    { font-family: 'Courier New', Courier, monospace; }
    .font-serif   { font-family: Georgia, serif; }
    .italic       { font-style: italic; }
    .uppercase    { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.05em; }
    .leading-tight { line-height: 1.25; }
    .flex         { display: flex; }
    .flex-col     { flex-direction: column; }
    .justify-between { justify-content: space-between; }
    .justify-end  { justify-content: flex-end; }
    .items-start  { align-items: flex-start; }
    .flex-1       { flex: 1; }
    .border-b     { border-bottom: 1px solid black; }
    .border-b-2   { border-bottom: 2px solid black; }
    .border-b-4   { border-bottom: 4px double black; }
    .my-2         { margin: 4px 0; }
    .mt-1         { margin-top: 2px; }
    .mt-2         { margin-top: 4px; }
    .mt-3         { margin-top: 6px; }
    .mt-4         { margin-top: 8px; }
    .mb-1         { margin-bottom: 2px; }
    .mb-4         { margin-bottom: 8px; }
    .mr-4         { margin-right: 8px; }
    .pr-2         { padding-right: 4px; }
    .py-0\\.5     { padding: 1px 0; }
    .space-y-0\\.5 > * + * { margin-top: 2px; }
    .space-y-1 > * + * { margin-top: 2px; }
    .space-y-1\\.5 > * + * { margin-top: 3px; }
    .text-xl      { font-size: 14px; }
    .text-base    { font-size: 12px; }
    .text-sm      { font-size: 11px; }
    .text-xs      { font-size: 10px; }
    .w-8          { width: 20px; }
    .w-16         { width: 40px; }
    .tabular-nums { font-variant-numeric: tabular-nums; }
    .truncate     { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .text-emerald-600 { color: #059669; }
    .text-gray-500 { color: #6b7280; }
    .underline    { text-decoration: underline; }
    @media print {
      html, body { width: 80mm; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
${receiptEl.innerHTML}
</body>
</html>`;

    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) {
      window.print();
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  const handleNewBill = () => {
    onNewBill();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white text-black p-0 border-0 rounded-xl overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-0 sr-only">
          <DialogTitle>Bill GFK-{String(bill.billNumber).padStart(3, "0")}</DialogTitle>
          <DialogDescription>Receipt for order</DialogDescription>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="p-6 bg-slate-100 flex justify-center max-h-[60vh] overflow-y-auto">
          <div className="print-receipt-wrapper bg-white shadow-sm w-[80mm] p-4 text-xs font-mono border border-slate-200 mx-auto">
            <div className="text-center mb-4">
              <div className="font-bold text-xl leading-tight uppercase tracking-wide">GAAN FUN KHAAN</div>
              <div className="text-[10px] mt-1 italic font-serif">A Symphony of Food & Music</div>
            </div>
            
            <div className="border-b border-solid border-black my-2"></div>
            
            <div className="flex flex-col text-[11px] space-y-0.5">
              <div className="flex justify-end">
                <span>Bill No: GFK-{String(bill.billNumber).padStart(3, "0")}</span>
              </div>
              <div className="flex justify-end">
                <span>Date: {format(new Date(bill.date), "dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-end">
                <span>Time: {format(new Date(bill.date), "h:mm a")}</span>
              </div>
              {bill.tableNumber && (
                <div className="flex justify-end font-bold">
                  <span>Table: {bill.tableNumber}</span>
                </div>
              )}
            </div>

            <div className="border-b border-solid border-black my-2"></div>
            
            <div className="flex justify-between font-bold mb-1 underline">
              <span className="flex-1 text-left">ITEM</span>
              <span className="w-8 text-center">QTY</span>
              <span className="w-16 text-right">AMOUNT</span>
            </div>
            
            <div className="flex flex-col space-y-1 mt-2">
              {bill.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="flex-1 pr-2 truncate">{item.name}</span>
                  <span className="w-8 text-center tabular-nums">{item.quantity}</span>
                  <span className="w-16 text-right tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-b-2 border-solid border-black my-2 mt-3"></div>

            <div className="flex flex-col space-y-1 text-[11px]">
              <div className="flex justify-end">
                <span className="mr-4">Subtotal:</span>
                <span className="w-16 text-right tabular-nums">₹{bill.subtotal.toFixed(2)}</span>
              </div>
              
              {bill.discountPercent > 0 && (
                <div className="flex justify-end text-emerald-600">
                  <span className="mr-4">Discount ({bill.discountPercent}%):</span>
                  <span className="w-16 text-right tabular-nums">-₹{bill.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {bill.gstPercent > 0 && (
                <div className="flex justify-end">
                  <span className="mr-4">GST ({bill.gstPercent}%):</span>
                  <span className="w-16 text-right tabular-nums">₹{bill.gstAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-b-4 border-double border-black my-2"></div>

            <div className="flex justify-between font-bold text-base mt-1">
              <span>TOTAL</span>
              <span className="tabular-nums">₹{bill.grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between mt-2 text-[11px]">
              <span>Payment Mode:</span>
              <span className="font-bold uppercase">{bill.paymentMode}</span>
            </div>
            
            <div className="border-b border-solid border-black my-4"></div>

            <div className="text-center space-y-1">
              <div className="font-bold">Thank you for your visit!</div>
              <div className="italic font-serif">Come for the Gaan, Stay for the Khaan!</div>
            </div>
            
            <div className="text-center text-[9px] text-gray-500 mt-4">
              GAAN FUN KHAAN • Darjeeling Hills
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-white border-t sm:justify-center gap-3">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto" 
            onClick={handleNewBill}
            data-testid="btn-modal-new-bill"
          >
            <FileText className="w-4 h-4 mr-2" />
            New Bill
          </Button>
          <Button 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" 
            onClick={handlePrint}
            data-testid="btn-modal-print"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print / Save PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}