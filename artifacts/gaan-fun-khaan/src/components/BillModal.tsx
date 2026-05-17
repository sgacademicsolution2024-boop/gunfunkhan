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
    window.print();
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
              <div className="font-bold text-lg leading-tight uppercase tracking-wide">Gaan Fun Khaan</div>
              <div className="text-[10px] mt-1 italic">A Symphony of Food & Music</div>
            </div>
            
            <div className="border-b border-dashed border-slate-400 my-2"></div>
            
            <div className="flex justify-between">
              <span>Bill No: GFK-{String(bill.billNumber).padStart(3, "0")}</span>
            </div>
            <div className="flex justify-between">
              <span>Date: {format(new Date(bill.date), "dd MMM yyyy, h:mm a")}</span>
            </div>
            {bill.tableNumber && (
              <div className="flex justify-between font-bold">
                <span>Table: {bill.tableNumber}</span>
              </div>
            )}

            <div className="border-b border-dashed border-slate-400 my-2"></div>
            
            <div className="flex justify-between font-bold mb-1">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-16 text-right">Amt</span>
            </div>
            
            <div className="border-b border-dashed border-slate-400 my-2"></div>

            {bill.items.map((item, idx) => (
              <div key={idx} className="flex justify-between mb-1">
                <span className="flex-1 truncate pr-2">{item.name}</span>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-16 text-right">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}

            <div className="border-b border-dashed border-slate-400 my-2"></div>

            <div className="flex justify-between mb-1">
              <span>Subtotal:</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            
            {bill.discountPercent > 0 && (
              <div className="flex justify-between mb-1">
                <span>Discount ({bill.discountPercent}%):</span>
                <span>-₹{bill.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            {bill.gstPercent > 0 && (
              <div className="flex justify-between mb-1">
                <span>GST ({bill.gstPercent}%):</span>
                <span>₹{bill.gstAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-b border-slate-800 border-2 my-2"></div>

            <div className="flex justify-between font-bold text-sm uppercase">
              <span>Grand Total:</span>
              <span>₹{bill.grandTotal.toFixed(2)}</span>
            </div>

            <div className="border-b border-slate-800 border-2 my-2"></div>
            
            <div className="flex justify-between mt-2">
              <span>Payment:</span>
              <span className="font-bold">{bill.paymentMode}</span>
            </div>
            
            <div className="border-b border-dashed border-slate-400 my-4"></div>

            <div className="text-center italic mt-4 mb-2">
              Come for the Gaan,<br/>Stay for the Khaan!
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
            Print Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
