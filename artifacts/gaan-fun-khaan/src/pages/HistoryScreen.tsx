import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Receipt, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { Bill } from "@/types/billing";
import { getBills, clearBills } from "@/lib/storage";
import { Button } from "@/components/ui/button";

function BillCard({ bill }: { bill: Bill }) {
  const [expanded, setExpanded] = useState(false);

  const getPaymentColor = (mode: string) => {
    switch (mode) {
      case "Cash": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "UPI": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Card": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden mb-4" data-testid={`card-bill-${bill.id}`}>
      <button 
        className="w-full p-4 flex flex-col gap-3 text-left focus:outline-none focus-visible:ring-2 ring-primary"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start w-full">
          <div>
            <div className="font-serif font-bold text-foreground text-lg">{bill.id}</div>
            <div className="text-sm text-muted-foreground">{format(new Date(bill.date), "dd MMM yyyy, h:mm a")}</div>
            {bill.tableNumber && (
              <div className="text-sm font-semibold text-accent-foreground bg-accent/20 inline-block px-2 py-0.5 rounded mt-1">
                Table {bill.tableNumber}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="font-black text-xl text-primary tabular-nums">₹{bill.grandTotal.toFixed(2)}</div>
            <div className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPaymentColor(bill.paymentMode)}`}>
              {bill.paymentMode}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center w-full pt-2 border-t border-dashed mt-1">
          <span className="text-sm font-medium text-muted-foreground">
            {bill.items.length} items
          </span>
          <div className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-muted/20 border-t">
          <div className="space-y-2 mt-2">
            {bill.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="flex gap-2">
                  <span className="font-medium w-6 text-muted-foreground">{item.quantity}x</span>
                  <span className="text-foreground">{item.name}</span>
                </div>
                <span className="font-medium tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            
            <div className="border-t border-dashed my-2 pt-2"></div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Discount ({bill.discountPercent}%)</span>
                <span>-₹{bill.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {bill.gstAmount > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>GST ({bill.gstPercent}%)</span>
                <span>₹{bill.gstAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryScreen() {
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    setBills(getBills());
  }, []);

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete ALL bill history? This cannot be undone.")) {
      clearBills();
      setBills([]);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 bg-card border-b px-4 py-4 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-primary">
          <Receipt className="w-6 h-6" />
          <h1 className="text-xl font-serif font-bold text-foreground">Bill History</h1>
        </div>
        {bills.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearAll}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            data-testid="btn-clear-history"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </header>

      <div className="p-4 max-w-3xl mx-auto">
        <div className="mb-4 text-sm font-medium text-muted-foreground">
          Showing {bills.length} bills
        </div>

        {bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 text-muted-foreground">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <Receipt className="w-10 h-10 opacity-40" />
            </div>
            <p className="text-lg font-medium text-foreground">No bills yet</p>
            <p>Start billing to see your transaction history here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map(bill => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
