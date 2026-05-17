import { useState, useEffect } from "react";
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import { BarChart2, TrendingUp, IndianRupee, CreditCard, Smartphone, Banknote, Trash2 } from "lucide-react";
import { getBills, clearTodaysBills } from "@/lib/storage";

type DateFilter = "Today" | "Yesterday" | "This Week" | "All Time";

export default function SalesScreen() {
  const [filter, setFilter] = useState<DateFilter>("Today");
  const [allBills, setAllBills] = useState(() => getBills());

  const loadBills = () => {
    setAllBills(getBills());
  };

  const filteredBills = allBills.filter(bill => {
    const date = parseISO(bill.date);
    switch (filter) {
      case "Today": return isToday(date);
      case "Yesterday": return isYesterday(date);
      case "This Week": return isThisWeek(date);
      case "All Time": return true;
      default: return true;
    }
  });

  const stats = (() => {
    let totalSales = 0;
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;

    filteredBills.forEach(bill => {
      totalSales += bill.grandTotal;
      if (bill.paymentMode === "Cash") cashSales += bill.grandTotal;
      if (bill.paymentMode === "UPI") upiSales += bill.grandTotal;
      if (bill.paymentMode === "Card") cardSales += bill.grandTotal;
    });

    return {
      totalBills: filteredBills.length,
      totalSales,
      cashSales,
      upiSales,
      cardSales
    };
  })();

  const handleClearTodaysSales = () => {
    if (window.confirm("Clear all of today's sales data? This cannot be undone.")) {
      clearTodaysBills();
      loadBills();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 bg-card border-b px-4 py-4 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <BarChart2 className="w-6 h-6" />
            <h1 className="text-xl font-serif font-bold text-foreground">Daily Sales</h1>
          </div>
          {filter === "Today" && filteredBills.length > 0 && (
            <button 
              onClick={handleClearTodaysSales}
              className="flex items-center text-sm font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Clear Today's Sales
            </button>
          )}
        </div>
        
        <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {(["Today", "Yesterday", "This Week", "All Time"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 max-w-3xl mx-auto space-y-6">
        
        {/* Main Stat Card */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="font-medium text-primary-foreground/80 mb-1 uppercase tracking-wider text-sm">Total Sales</p>
            <div className="text-4xl font-black font-sans tabular-nums mb-4">
              ₹{stats.totalSales.toFixed(2)}
            </div>
            <div className="inline-flex bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
              {stats.totalBills} Bills generated
            </div>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cash Sales</p>
              <p className="text-xl font-bold text-foreground tabular-nums">₹{stats.cashSales.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">UPI Sales</p>
              <p className="text-xl font-bold text-foreground tabular-nums">₹{stats.upiSales.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Card Sales</p>
              <p className="text-xl font-bold text-foreground tabular-nums">₹{stats.cardSales.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Recent list */}
        <div className="pt-4">
          <h2 className="text-lg font-serif font-bold text-foreground mb-4">Recent Bills ({filter})</h2>
          
          {filteredBills.length === 0 ? (
            <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
              <p className="text-muted-foreground">No sales recorded for this period.</p>
            </div>
          ) : (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="divide-y">
                {filteredBills.map(bill => (
                  <div key={bill.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="font-medium text-foreground">{bill.id}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(bill.date), "h:mm a")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold tabular-nums">₹{bill.grandTotal.toFixed(2)}</div>
                      <div className="text-xs font-medium text-muted-foreground">{bill.paymentMode}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}