import { useState } from "react";
import {
  format, isToday, isYesterday, isThisWeek, parseISO,
  startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, eachWeekOfInterval,
  isSameDay, isSameMonth, isSameWeek, getWeek,
} from "date-fns";
import {
  TrendingUp, CreditCard, Smartphone, Banknote,
  Trash2, Printer, Trophy, Calendar,
} from "lucide-react";
import { getBills, clearTodaysBills } from "@/lib/storage";
import type { Bill } from "@/types/billing";
import Logo from "@/components/Logo";

type Period = "Daily" | "Weekly" | "Monthly" | "All Time";

/* ─── helpers ─── */
function filterBills(bills: Bill[], period: Period): Bill[] {
  return bills.filter(bill => {
    const d = parseISO(bill.date);
    switch (period) {
      case "Daily":    return isToday(d);
      case "Weekly":   return isThisWeek(d, { weekStartsOn: 1 });
      case "Monthly":  return isSameMonth(d, new Date());
      case "All Time": return true;
    }
  });
}

interface Stats {
  totalBills: number;
  totalSales: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  avgBill: number;
  cashPct: number;
  upiPct: number;
  cardPct: number;
  topItems: { name: string; qty: number; revenue: number }[];
  firstBillTime: Date | null;
  lastBillTime: Date | null;
}

function computeStats(bills: Bill[]): Stats {
  let totalSales = 0, cashSales = 0, upiSales = 0, cardSales = 0;
  const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};

  bills.forEach(b => {
    totalSales += b.grandTotal;
    if (b.paymentMode === "Cash") cashSales += b.grandTotal;
    if (b.paymentMode === "UPI")  upiSales  += b.grandTotal;
    if (b.paymentMode === "Card") cardSales += b.grandTotal;
    b.items.forEach(item => {
      if (!itemMap[item.menuItemId])
        itemMap[item.menuItemId] = { name: item.name, qty: 0, revenue: 0 };
      itemMap[item.menuItemId].qty     += item.quantity;
      itemMap[item.menuItemId].revenue += item.price * item.quantity;
    });
  });

  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 10);
  const sorted   = [...bills].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  return {
    totalBills: bills.length,
    totalSales, cashSales, upiSales, cardSales,
    avgBill: bills.length > 0 ? totalSales / bills.length : 0,
    cashPct:  totalSales > 0 ? (cashSales / totalSales) * 100 : 0,
    upiPct:   totalSales > 0 ? (upiSales  / totalSales) * 100 : 0,
    cardPct:  totalSales > 0 ? (cardSales / totalSales) * 100 : 0,
    topItems,
    firstBillTime: sorted[0]     ? new Date(sorted[0].date)     : null,
    lastBillTime:  sorted.at(-1) ? new Date(sorted.at(-1)!.date) : null,
  };
}

/* ─── sub-components ─── */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border rounded-xl p-4 text-center shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-black text-primary tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function PayBar({ label, value, pct, color, icon }: {
  label: string; value: number; pct: number; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-bold text-foreground">{label}</span>
          <span className="text-sm font-semibold tabular-nums">
            ₹{value.toFixed(0)}
            <span className="text-muted-foreground font-normal ml-1 text-xs">({pct.toFixed(0)}%)</span>
          </span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              label === "Cash" ? "bg-emerald-500" : label === "UPI" ? "bg-blue-500" : "bg-purple-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function BestSellers({ items }: { items: Stats["topItems"] }) {
  if (items.length === 0) return null;
  const maxQty = items[0].qty;
  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b bg-amber-50">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h3 className="font-serif font-bold text-sm text-foreground">Best Selling Products</h3>
      </div>
      <div className="divide-y">
        {items.map((item, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    i === 0 ? "bg-amber-400 text-white" :
                    i === 1 ? "bg-slate-300 text-slate-700" :
                    i === 2 ? "bg-orange-300 text-orange-800" :
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="font-semibold text-sm text-foreground truncate">{item.name}</span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="text-sm font-black text-foreground tabular-nums">{item.qty}</span>
                <span className="text-xs text-muted-foreground ml-1">sold</span>
                <span className="text-xs text-muted-foreground ml-2 tabular-nums">· ₹{item.revenue.toFixed(0)}</span>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-500"
                style={{ width: `${(item.qty / maxQty) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyBreakdown({ bills }: { bills: Bill[] }) {
  const now   = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end   = endOfWeek(now,   { weekStartsOn: 1 });
  const days  = eachDayOfInterval({ start, end });
  const maxTotal = Math.max(
    ...days.map(day => bills.filter(b => isSameDay(parseISO(b.date), day)).reduce((s, b) => s + b.grandTotal, 0)),
    1
  );

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="font-serif font-bold text-sm text-foreground">This Week — Day by Day</h3>
      </div>
      <div className="divide-y">
        {days.map(day => {
          const dayBills = bills.filter(b => isSameDay(parseISO(b.date), day));
          const total = dayBills.reduce((s, b) => s + b.grandTotal, 0);
          const isCurrentDay = isToday(day);
          return (
            <div key={day.toISOString()} className={`flex items-center gap-3 px-4 py-3 ${isCurrentDay ? "bg-primary/5" : ""}`}>
              <div className="w-16 shrink-0">
                <p className={`text-xs font-bold ${isCurrentDay ? "text-primary" : "text-muted-foreground"}`}>
                  {format(day, "EEE")}
                </p>
                <p className="text-xs text-muted-foreground">{format(day, "d MMM")}</p>
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(total / maxTotal) * 100}%` }}
                />
              </div>
              <div className="w-24 text-right shrink-0">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {total > 0 ? `₹${total.toFixed(0)}` : "—"}
                </span>
                {dayBills.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">({dayBills.length})</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthlyBreakdown({ bills }: { bills: Bill[] }) {
  const now    = new Date();
  const mStart = startOfMonth(now);
  const mEnd   = endOfMonth(now);
  const weeks  = eachWeekOfInterval({ start: mStart, end: mEnd }, { weekStartsOn: 1 });

  const rows = weeks.map((wStart, i) => {
    const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
    const wBills = bills.filter(b => isSameWeek(parseISO(b.date), wStart, { weekStartsOn: 1 }));
    const total = wBills.reduce((s, b) => s + b.grandTotal, 0);
    return { wStart, wEnd, wBills, total, weekNum: i + 1 };
  });

  const maxTotal = Math.max(...rows.map(r => r.total), 1);

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="font-serif font-bold text-sm text-foreground">
          {format(now, "MMMM yyyy")} — Week by Week
        </h3>
      </div>
      <div className="divide-y">
        {rows.map(({ wStart, wEnd, wBills, total, weekNum }) => {
          const isCurrentWeek = isSameWeek(new Date(), wStart, { weekStartsOn: 1 });
          return (
            <div key={getWeek(wStart)} className={`flex items-center gap-3 px-4 py-3 ${isCurrentWeek ? "bg-primary/5" : ""}`}>
              <div className="w-24 shrink-0">
                <p className={`text-xs font-bold ${isCurrentWeek ? "text-primary" : "text-muted-foreground"}`}>
                  Week {weekNum}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(wStart, "d")}–{format(wEnd, "d MMM")}
                </p>
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(total / maxTotal) * 100}%` }}
                />
              </div>
              <div className="w-24 text-right shrink-0">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {total > 0 ? `₹${total.toFixed(0)}` : "—"}
                </span>
                {wBills.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">({wBills.length})</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrintableReport({
  period, stats, periodLabel,
}: { period: Period; stats: Stats; periodLabel: string }) {
  return (
    <div
      className="sales-report-print hidden print:block"
      style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", width: "80mm", margin: "0 auto", color: "#000", background: "#fff", padding: "4mm" }}
    >
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <div style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "1px" }}>GAAN FUN KHAAN</div>
        <div style={{ fontSize: "10px", fontStyle: "italic" }}>A Symphony of Food &amp; Music</div>
      </div>
      <div style={{ borderTop: "2px solid #000", marginBottom: "6px" }} />
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>
        {period.toUpperCase()} SALES REPORT
      </div>
      <div style={{ textAlign: "center", marginBottom: "8px", fontSize: "11px" }}>Period: {periodLabel}</div>
      <div style={{ textAlign: "center", marginBottom: "8px", fontSize: "10px" }}>
        Printed: {format(new Date(), "dd MMM yyyy, h:mm a")}
      </div>
      <div style={{ borderTop: "1px dashed #000", marginBottom: "6px" }} />

      <Row label="Total Bills:"    value={String(stats.totalBills)} />
      <Row label="Total Sales:"    value={`₹${stats.totalSales.toFixed(2)}`} />
      <Row label="Avg. Bill:"      value={`₹${stats.avgBill.toFixed(2)}`} />
      {stats.firstBillTime && <Row label="First Order:" value={format(stats.firstBillTime, "h:mm a")} />}
      {stats.lastBillTime  && <Row label="Last Order:"  value={format(stats.lastBillTime,  "h:mm a")} />}

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>PAYMENT BREAKDOWN</div>
      <Row label="Cash:" value={`₹${stats.cashSales.toFixed(2)} (${stats.cashPct.toFixed(0)}%)`} />
      <Row label="UPI:"  value={`₹${stats.upiSales.toFixed(2)} (${stats.upiPct.toFixed(0)}%)`}  />
      <Row label="Card:" value={`₹${stats.cardSales.toFixed(2)} (${stats.cardPct.toFixed(0)}%)`} />

      {stats.topItems.length > 0 && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>BEST SELLING PRODUCTS</div>
          {stats.topItems.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ maxWidth: "52mm", overflow: "hidden" }}>{i + 1}. {item.name}</span>
              <span>{item.qty} sold · ₹{item.revenue.toFixed(0)}</span>
            </div>
          ))}
        </>
      )}

      <div style={{ borderTop: "2px solid #000", margin: "8px 0" }} />
      <div style={{ textAlign: "center", fontStyle: "italic", fontSize: "10px" }}>
        Come for the Gaan, Stay for the Khaan!
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
      <span>{label}</span>
      <span style={{ fontWeight: "bold" }}>{value}</span>
    </div>
  );
}

/* ─── Main Screen ─── */
export default function SalesScreen() {
  const [period, setPeriod] = useState<Period>("Daily");
  const [allBills, setAllBills] = useState(() => getBills());

  const filtered = filterBills(allBills, period);
  const stats    = computeStats(filtered);

  const reload = () => setAllBills(getBills());

  const periodLabel =
    period === "Daily"   ? format(new Date(), "dd MMM yyyy") :
    period === "Weekly"  ? `Week of ${format(startOfWeek(new Date(), { weekStartsOn: 1 }), "dd MMM")}` :
    period === "Monthly" ? format(new Date(), "MMMM yyyy") :
    "All Time";

  const handleClear = () => {
    if (window.confirm("Clear all of today's sales? This cannot be undone.")) {
      clearTodaysBills();
      reload();
    }
  };

  const PERIODS: Period[] = ["Daily", "Weekly", "Monthly", "All Time"];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      <PrintableReport period={period} stats={stats} periodLabel={periodLabel} />

      {/* Header */}
      <header className="sticky top-0 bg-primary text-primary-foreground px-4 pt-3 pb-0 z-10 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" className="shadow-sm" />
            <h1 className="text-lg font-serif font-bold">Sales Report</h1>
          </div>
          <div className="flex items-center gap-2">
            {filtered.length > 0 && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-3 py-1.5 rounded-full transition-colors active:scale-95"
                data-testid="btn-print-report"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            )}
            {period === "Daily" && filtered.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-3 py-1.5 rounded-full transition-colors"
                data-testid="btn-clear-today"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-3">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              data-testid={`btn-period-${p}`}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                period === p
                  ? "bg-white text-primary shadow-sm"
                  : "bg-white/20 text-white/90 hover:bg-white/30"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 max-w-3xl mx-auto space-y-4">

        {/* Hero Total */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-28 h-28" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70 mb-1">
            Total Sales — {periodLabel}
          </p>
          <div className="text-5xl font-black tabular-nums mb-3">
            ₹{stats.totalSales.toFixed(2)}
          </div>
          <div className="flex gap-3 flex-wrap">
            <span className="bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
              {stats.totalBills} {stats.totalBills === 1 ? "bill" : "bills"}
            </span>
            {stats.avgBill > 0 && (
              <span className="bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
                Avg ₹{stats.avgBill.toFixed(0)} / bill
              </span>
            )}
            {stats.firstBillTime && (
              <span className="bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
                {format(stats.firstBillTime, "h:mm a")} – {stats.lastBillTime ? format(stats.lastBillTime, "h:mm a") : ""}
              </span>
            )}
          </div>
        </div>

        {stats.totalBills === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed">
            <p className="text-muted-foreground font-semibold">No sales recorded for this period.</p>
            <p className="text-sm text-muted-foreground mt-1">Start billing to see your report here.</p>
          </div>
        ) : (
          <>
            {/* Key Numbers */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Bills"     value={String(stats.totalBills)} />
              <StatCard label="Avg Bill"  value={`₹${stats.avgBill.toFixed(0)}`} />
              <StatCard
                label="Top Seller"
                value={stats.topItems[0]?.qty > 0 ? String(stats.topItems[0].qty) : "—"}
                sub={stats.topItems[0]?.name ?? ""}
              />
            </div>

            {/* Payment Breakdown */}
            <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-sm text-foreground">Payment Breakdown</h3>
              <PayBar label="Cash" value={stats.cashSales} pct={stats.cashPct}
                color="bg-emerald-100"
                icon={<Banknote className="w-4 h-4 text-emerald-600" />} />
              <PayBar label="UPI" value={stats.upiSales} pct={stats.upiPct}
                color="bg-blue-100"
                icon={<Smartphone className="w-4 h-4 text-blue-600" />} />
              <PayBar label="Card" value={stats.cardSales} pct={stats.cardPct}
                color="bg-purple-100"
                icon={<CreditCard className="w-4 h-4 text-purple-600" />} />
            </div>

            {/* Best Sellers */}
            <BestSellers items={stats.topItems} />

            {/* Period Breakdown */}
            {period === "Weekly"  && <WeeklyBreakdown  bills={filtered} />}
            {period === "Monthly" && <MonthlyBreakdown bills={filtered} />}

            {/* Transactions List */}
            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3.5 border-b">
                <h3 className="font-serif font-bold text-sm text-foreground">Transactions</h3>
              </div>
              <div className="divide-y max-h-[400px] overflow-y-auto hide-scrollbar">
                {[...filtered].reverse().map(bill => (
                  <div key={bill.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors" data-testid={`row-bill-${bill.id}`}>
                    <div>
                      <p className="font-bold text-sm text-foreground">{bill.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(bill.date), "d MMM, h:mm a")} · {bill.items.length} items
                      </p>
                      {bill.tableNumber && (
                        <p className="text-xs font-semibold text-primary mt-0.5">Table {bill.tableNumber}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-black tabular-nums text-foreground">₹{bill.grandTotal.toFixed(2)}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${
                        bill.paymentMode === "Cash"  ? "text-emerald-600" :
                        bill.paymentMode === "UPI"   ? "text-blue-600"    :
                        "text-purple-600"
                      }`}>{bill.paymentMode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
