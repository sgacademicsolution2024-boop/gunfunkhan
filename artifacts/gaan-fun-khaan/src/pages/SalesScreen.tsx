import { useState, useRef } from "react";
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import { BarChart2, TrendingUp, CreditCard, Smartphone, Banknote, Trash2, Printer, FileText } from "lucide-react";
import { getBills, clearTodaysBills } from "@/lib/storage";
import type { Bill } from "@/types/billing";
import Logo from "@/components/Logo";

type DateFilter = "Today" | "Yesterday" | "This Week" | "All Time";

function filterBills(bills: Bill[], filter: DateFilter): Bill[] {
  return bills.filter(bill => {
    const date = parseISO(bill.date);
    switch (filter) {
      case "Today": return isToday(date);
      case "Yesterday": return isYesterday(date);
      case "This Week": return isThisWeek(date);
      case "All Time": return true;
      default: return true;
    }
  });
}

function computeStats(bills: Bill[]) {
  let totalSales = 0, cashSales = 0, upiSales = 0, cardSales = 0;
  const itemCounts: Record<string, { name: string; qty: number; revenue: number }> = {};

  bills.forEach(bill => {
    totalSales += bill.grandTotal;
    if (bill.paymentMode === "Cash") cashSales += bill.grandTotal;
    if (bill.paymentMode === "UPI") upiSales += bill.grandTotal;
    if (bill.paymentMode === "Card") cardSales += bill.grandTotal;
    bill.items.forEach(item => {
      if (!itemCounts[item.menuItemId]) {
        itemCounts[item.menuItemId] = { name: item.name, qty: 0, revenue: 0 };
      }
      itemCounts[item.menuItemId].qty += item.quantity;
      itemCounts[item.menuItemId].revenue += item.price * item.quantity;
    });
  });

  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const sortedByDate = [...bills].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const firstBill = sortedByDate[0];
  const lastBill = sortedByDate[sortedByDate.length - 1];

  return {
    totalBills: bills.length,
    totalSales,
    cashSales,
    upiSales,
    cardSales,
    avgBill: bills.length > 0 ? totalSales / bills.length : 0,
    topItems,
    firstBillTime: firstBill ? new Date(firstBill.date) : null,
    lastBillTime: lastBill ? new Date(lastBill.date) : null,
    cashPct: totalSales > 0 ? (cashSales / totalSales) * 100 : 0,
    upiPct: totalSales > 0 ? (upiSales / totalSales) * 100 : 0,
    cardPct: totalSales > 0 ? (cardSales / totalSales) * 100 : 0,
  };
}

export default function SalesScreen() {
  const [filter, setFilter] = useState<DateFilter>("Today");
  const [allBills, setAllBills] = useState(() => getBills());
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const filteredBills = filterBills(allBills, filter);
  const stats = computeStats(filteredBills);

  const loadBills = () => setAllBills(getBills());

  const handleClearTodaysSales = () => {
    if (window.confirm("Clear all of today's sales data? This cannot be undone.")) {
      clearTodaysBills();
      loadBills();
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const periodLabel =
    filter === "Today" ? format(new Date(), "dd MMM yyyy")
    : filter === "Yesterday" ? format(new Date(Date.now() - 86400000), "dd MMM yyyy")
    : filter;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">

      {/* PRINTABLE REPORT — hidden on screen, shown on print */}
      <div
        ref={reportRef}
        className="sales-report-print hidden print:block"
        aria-hidden="true"
      >
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", width: "80mm", margin: "0 auto", color: "#000", background: "#fff", padding: "4mm" }}>
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "1px" }}>GAAN FUN KHAAN</div>
            <div style={{ fontSize: "10px", fontStyle: "italic" }}>A Symphony of Food &amp; Music</div>
          </div>
          <div style={{ borderTop: "2px solid #000", marginBottom: "6px" }}></div>
          <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>
            SHIFT SUMMARY REPORT
          </div>
          <div style={{ textAlign: "center", marginBottom: "8px", fontSize: "11px" }}>Period: {periodLabel}</div>
          <div style={{ borderTop: "1px dashed #000", marginBottom: "6px" }}></div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>Printed:</span>
            <span>{format(new Date(), "dd MMM yyyy, h:mm a")}</span>
          </div>
          {stats.firstBillTime && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span>First Order:</span>
              <span>{format(stats.firstBillTime, "h:mm a")}</span>
            </div>
          )}
          {stats.lastBillTime && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span>Last Order:</span>
              <span>{format(stats.lastBillTime, "h:mm a")}</span>
            </div>
          )}
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>Total Bills:</span>
            <span style={{ fontWeight: "bold" }}>{stats.totalBills}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>Total Sales:</span>
            <span style={{ fontWeight: "bold" }}>&#8377;{stats.totalSales.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>Avg. Bill Value:</span>
            <span style={{ fontWeight: "bold" }}>&#8377;{stats.avgBill.toFixed(2)}</span>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>

          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>PAYMENT BREAKDOWN</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>Cash:</span>
            <span>&#8377;{stats.cashSales.toFixed(2)} ({stats.cashPct.toFixed(0)}%)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>UPI:</span>
            <span>&#8377;{stats.upiSales.toFixed(2)} ({stats.upiPct.toFixed(0)}%)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>Card:</span>
            <span>&#8377;{stats.cardSales.toFixed(2)} ({stats.cardPct.toFixed(0)}%)</span>
          </div>

          {stats.topItems.length > 0 && (
            <>
              <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>TOP ITEMS</div>
              {stats.topItems.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ maxWidth: "55mm", overflow: "hidden" }}>{i + 1}. {item.name}</span>
                  <span>{item.qty} sold</span>
                </div>
              ))}
            </>
          )}

          <div style={{ borderTop: "2px solid #000", margin: "8px 0" }}></div>
          <div style={{ textAlign: "center", fontStyle: "italic", fontSize: "10px" }}>
            Come for the Gaan, Stay for the Khaan!
          </div>
        </div>
      </div>

      {/* SCREEN UI */}
      <header className="sticky top-0 bg-card border-b px-4 py-4 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" className="shadow-sm" />
            <h1 className="text-lg font-serif font-bold text-foreground">Daily Sales</h1>
          </div>
          <div className="flex items-center gap-2">
            {filteredBills.length > 0 && (
              <button
                onClick={() => setShowReport(!showReport)}
                className="flex items-center text-sm font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                data-testid="btn-toggle-report"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                Report
              </button>
            )}
            {filter === "Today" && filteredBills.length > 0 && (
              <button
                onClick={handleClearTodaysSales}
                className="flex items-center text-sm font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors"
                data-testid="btn-clear-today"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {(["Today", "Yesterday", "This Week", "All Time"] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setShowReport(false); }}
              data-testid={`btn-filter-${f}`}
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

      <div className="p-4 max-w-3xl mx-auto space-y-5">

        {/* SUMMARY REPORT PANEL */}
        {showReport && filteredBills.length > 0 && (
          <div className="bg-card border-2 border-primary/20 rounded-2xl overflow-hidden shadow-md" data-testid="panel-summary-report">
            <div className="bg-primary/8 px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg text-foreground">Shift Summary Report</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{periodLabel}</p>
              </div>
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-4 py-2 rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow"
                data-testid="btn-print-report"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Timing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">First Order</p>
                  <p className="text-xl font-black tabular-nums text-foreground">
                    {stats.firstBillTime ? format(stats.firstBillTime, "h:mm a") : "—"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Last Order</p>
                  <p className="text-xl font-black tabular-nums text-foreground">
                    {stats.lastBillTime ? format(stats.lastBillTime, "h:mm a") : "—"}
                  </p>
                </div>
              </div>

              {/* Key Numbers */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-primary/8 rounded-xl p-4 text-center border border-primary/15">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Orders</p>
                  <p className="text-2xl font-black text-primary">{stats.totalBills}</p>
                </div>
                <div className="bg-primary/8 rounded-xl p-4 text-center border border-primary/15">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-black text-primary">₹{stats.totalSales.toFixed(0)}</p>
                </div>
                <div className="bg-primary/8 rounded-xl p-4 text-center border border-primary/15">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Avg. Bill</p>
                  <p className="text-2xl font-black text-primary">₹{stats.avgBill.toFixed(0)}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Payment Breakdown</h3>
                <div className="space-y-2">
                  {[
                    { label: "Cash", value: stats.cashSales, pct: stats.cashPct, color: "bg-emerald-500" },
                    { label: "UPI", value: stats.upiSales, pct: stats.upiPct, color: "bg-blue-500" },
                    { label: "Card", value: stats.cardSales, pct: stats.cardPct, color: "bg-purple-500" },
                  ].map(({ label, value, pct, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-12 text-sm font-bold text-foreground shrink-0">{label}</div>
                      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-28 text-right text-sm tabular-nums font-semibold text-foreground">
                        ₹{value.toFixed(2)}
                        <span className="text-muted-foreground font-normal ml-1">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Items */}
              {stats.topItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Top Items</h3>
                  <div className="bg-muted/40 rounded-xl overflow-hidden divide-y divide-border">
                    {stats.topItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="font-medium text-foreground text-sm">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-foreground">{item.qty} sold</span>
                          <span className="text-xs text-muted-foreground ml-2">₹{item.revenue.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Stat Card */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="font-medium text-primary-foreground/80 mb-1 uppercase tracking-wider text-sm">Total Sales</p>
            <div className="text-4xl font-black tabular-nums mb-4">
              ₹{stats.totalSales.toFixed(2)}
            </div>
            <div className="inline-flex bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
              {stats.totalBills} {stats.totalBills === 1 ? "Bill" : "Bills"} generated
            </div>
          </div>
        </div>

        {/* Payment Breakdown Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cash</p>
            <p className="text-lg font-black text-foreground tabular-nums">₹{stats.cashSales.toFixed(0)}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">UPI</p>
            <p className="text-lg font-black text-foreground tabular-nums">₹{stats.upiSales.toFixed(0)}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Card</p>
            <p className="text-lg font-black text-foreground tabular-nums">₹{stats.cardSales.toFixed(0)}</p>
          </div>
        </div>

        {/* Bills List */}
        <div>
          <h2 className="text-base font-serif font-bold text-foreground mb-3">Bills — {filter}</h2>
          {filteredBills.length === 0 ? (
            <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
              <p className="text-muted-foreground">No sales recorded for this period.</p>
            </div>
          ) : (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="divide-y">
                {filteredBills.map(bill => (
                  <div key={bill.id} className="px-4 py-3 flex justify-between items-center hover:bg-muted/30 transition-colors" data-testid={`row-bill-${bill.id}`}>
                    <div>
                      <div className="font-bold text-foreground text-sm">{bill.id}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(bill.date), "h:mm a")} · {bill.items.length} items</div>
                      {bill.tableNumber && (
                        <div className="text-xs font-semibold text-primary mt-0.5">Table {bill.tableNumber}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-black tabular-nums text-foreground">₹{bill.grandTotal.toFixed(2)}</div>
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
