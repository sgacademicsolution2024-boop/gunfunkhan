import { useState } from "react";
import { Music2, Plus, Minus, X, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { MENU_ITEMS, CATEGORIES, type Category } from "@/data/menu";
import { useBilling } from "@/hooks/useBilling";
import type { Bill, PaymentMode } from "@/types/billing";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import BillModal from "@/components/BillModal";

export default function BillingScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"menu" | "cart">("menu");

  const {
    cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount,
    tableNumber, setTableNumber,
    discountPercent, setDiscountPercent,
    gstPercent, setGstPercent,
    paymentMode, setPaymentMode,
    subtotal, discountAmount, gstAmount, grandTotal,
    generateBill,
  } = useBilling();

  const filteredMenu = activeCategory === "All"
    ? MENU_ITEMS
    : MENU_ITEMS.filter(item => item.category === activeCategory);

  const handleItemClick = (item: typeof MENU_ITEMS[0]) => {
    let price = item.price;
    if (price === null) {
      const input = window.prompt(`Enter price for ${item.name} (₹):`);
      if (!input || isNaN(Number(input))) return;
      price = Number(input);
    }
    addToCart({ id: item.id, name: item.name, price });
  };

  const handleGenerateBill = () => {
    if (cart.length === 0) return;
    const bill = generateBill();
    setGeneratedBill(bill);
    setIsModalOpen(true);
  };

  const handleNewBill = () => {
    if (cart.length > 0 && window.confirm("Clear cart and start a new bill?")) {
      clearCart();
      setMobileView("menu");
    }
  };

  const handleModalNewBill = () => {
    clearCart();
    setIsModalOpen(false);
    setMobileView("menu");
  };

  const CartPanel = (
    <div className="flex flex-col h-full bg-card">
      {/* Cart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-card">
        <button
          onClick={() => setMobileView("menu")}
          className="md:hidden flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          data-testid="btn-back-to-menu"
        >
          <ArrowLeft className="w-4 h-4" />
          Menu
        </button>
        <h2 className="font-serif font-bold text-lg text-foreground">
          Current Order
          {cartCount > 0 && (
            <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-bold align-middle">
              {cartCount}
            </span>
          )}
        </h2>
        <button
          onClick={handleNewBill}
          className="flex items-center gap-1 text-sm font-semibold text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg transition-colors"
          data-testid="btn-clear-cart"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center py-10 gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Music2 className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-semibold">No items yet</p>
            <p className="text-sm">Tap items from the menu to add them here.</p>
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            {cart.map(item => (
              <div
                key={item.menuItemId}
                className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2.5"
                data-testid={`row-cartitem-${item.menuItemId}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate leading-tight">{item.name}</div>
                  <div className="text-xs text-muted-foreground">₹{item.price.toFixed(2)} each</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-card border rounded-full shadow-sm">
                    <button
                      className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      data-testid={`btn-dec-${item.menuItemId}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-bold text-sm tabular-nums">{item.quantity}</span>
                    <button
                      className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      data-testid={`btn-inc-${item.menuItemId}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="w-14 text-right font-bold text-sm tabular-nums">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                    onClick={() => removeFromCart(item.menuItemId)}
                    data-testid={`btn-remove-${item.menuItemId}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer — never scrolls */}
      <div className="shrink-0 border-t bg-card px-4 pt-3 pb-4 space-y-3">
        {/* Inputs row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Table</label>
            <Input
              type="text"
              placeholder="T1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="h-9 text-sm bg-muted border-transparent"
              data-testid="input-table-number"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Discount %</label>
            <Input
              type="number"
              placeholder="0"
              min="0"
              max="100"
              value={discountPercent || ""}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="h-9 text-sm bg-muted border-transparent"
              data-testid="input-discount"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">GST %</label>
            <Input
              type="number"
              placeholder="0"
              min="0"
              max="100"
              value={gstPercent || ""}
              onChange={(e) => setGstPercent(Number(e.target.value))}
              className="h-9 text-sm bg-muted border-transparent"
              data-testid="input-gst"
            />
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">₹{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discount ({discountPercent}%)</span>
              <span className="tabular-nums">−₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          {gstAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>GST ({gstPercent}%)</span>
              <span className="tabular-nums">₹{gstAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1.5 border-t">
            <span className="font-serif font-bold text-lg">Grand Total</span>
            <span className="font-black text-2xl text-primary tabular-nums">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment mode */}
        <ToggleGroup
          type="single"
          value={paymentMode}
          onValueChange={(v) => v && setPaymentMode(v as PaymentMode)}
          className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-xl"
        >
          {(["Cash", "UPI", "Card"] as const).map(mode => (
            <ToggleGroupItem
              key={mode}
              value={mode}
              className="rounded-lg font-bold text-sm data-[state=on]:bg-white data-[state=on]:text-primary data-[state=on]:shadow-sm h-10 transition-all"
              data-testid={`toggle-payment-${mode}`}
            >
              {mode}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* Generate Bill */}
        <button
          onClick={handleGenerateBill}
          disabled={cart.length === 0}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          data-testid="btn-generate-bill"
        >
          GENERATE BILL
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── DESKTOP LAYOUT ─── */}
      <div className="hidden md:flex h-screen bg-background overflow-hidden">
        {/* Left: Menu */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="flex items-center gap-3 px-5 py-3.5 bg-primary text-primary-foreground shadow-md shrink-0">
            <Music2 className="w-6 h-6" />
            <h1 className="text-xl font-serif font-bold tracking-tight">Gaan Fun Khaan</h1>
          </header>

          <div className="px-4 py-3 border-b bg-card shrink-0 overflow-x-auto hide-scrollbar">
            <div className="flex gap-2 min-w-max">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  data-testid={`tab-category-${cat}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMenu.map(item => {
                const cartItem = cart.find(c => c.menuItemId === item.id);
                return (
                  <button
                    key={item.id}
                    data-testid={`card-menuitem-${item.id}`}
                    onClick={() => handleItemClick(item)}
                    className="relative flex flex-col justify-between text-left p-4 rounded-xl border-2 border-transparent bg-card shadow-sm hover:border-primary/20 hover:shadow-md transition-all min-h-[90px] active:scale-95"
                  >
                    {cartItem && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow z-10">
                        {cartItem.quantity}
                      </span>
                    )}
                    <span className="font-semibold text-card-foreground leading-snug line-clamp-2 text-sm">{item.name}</span>
                    <span className="mt-2 text-primary font-bold text-sm">
                      {item.price === null ? "On Request" : `₹${item.price.toFixed(2)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-[380px] xl:w-[420px] border-l shadow-xl shrink-0 h-full overflow-hidden">
          {CartPanel}
        </div>
      </div>

      {/* ─── MOBILE LAYOUT ─── */}
      <div className="md:hidden flex flex-col h-[100dvh] bg-background overflow-hidden">

        {mobileView === "menu" ? (
          /* MENU VIEW */
          <>
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shadow-md shrink-0">
              <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5" />
                <h1 className="text-lg font-serif font-bold">Gaan Fun Khaan</h1>
              </div>
              {cartCount > 0 && (
                <button
                  onClick={() => setMobileView("cart")}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm font-bold transition-colors active:scale-95"
                  data-testid="btn-open-cart"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {cartCount}
                </button>
              )}
            </header>

            {/* Category tabs */}
            <div className="px-3 py-2.5 border-b bg-card shrink-0 overflow-x-auto hide-scrollbar">
              <div className="flex gap-2 min-w-max">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    data-testid={`tab-category-${cat}`}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu grid — fills remaining space, padded for nav */}
            <div className="flex-1 overflow-y-auto hide-scrollbar p-3 pb-[72px]">
              <div className="grid grid-cols-2 gap-3">
                {filteredMenu.map(item => {
                  const cartItem = cart.find(c => c.menuItemId === item.id);
                  return (
                    <button
                      key={item.id}
                      data-testid={`card-menuitem-${item.id}`}
                      onClick={() => handleItemClick(item)}
                      className="relative flex flex-col justify-between text-left p-4 rounded-2xl border-2 border-transparent bg-card shadow-sm active:scale-95 active:border-primary/30 transition-all min-h-[90px]"
                    >
                      {cartItem && (
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow z-10">
                          {cartItem.quantity}
                        </span>
                      )}
                      <span className="font-semibold text-foreground leading-snug line-clamp-2 text-sm">{item.name}</span>
                      <span className="mt-2 text-primary font-bold">
                        {item.price === null ? "On Request" : `₹${item.price.toFixed(2)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sticky cart strip — sits just above the nav bar */}
            {cartCount > 0 && (
              <div className="fixed bottom-16 left-0 right-0 z-30 px-3 pb-2">
                <button
                  onClick={() => setMobileView("cart")}
                  className="w-full flex items-center justify-between bg-primary text-primary-foreground rounded-2xl px-5 py-3.5 shadow-xl active:scale-[0.98] transition-all"
                  data-testid="btn-cart-strip"
                >
                  <div className="flex items-center gap-2 font-bold">
                    <ShoppingCart className="w-5 h-5" />
                    <span>{cartCount} {cartCount === 1 ? "item" : "items"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg tabular-nums">₹{grandTotal.toFixed(2)}</span>
                    <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded-full">View Cart →</span>
                  </div>
                </button>
              </div>
            )}
          </>
        ) : (
          /* CART VIEW */
          <div className="flex flex-col h-full pb-16 overflow-hidden">
            {CartPanel}
          </div>
        )}
      </div>

      <BillModal
        bill={generatedBill}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNewBill={handleModalNewBill}
      />
    </>
  );
}
