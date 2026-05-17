import { useState } from "react";
import { Music2, Plus, Minus, X, Trash2 } from "lucide-react";
import { MENU_ITEMS, CATEGORIES, type Category } from "@/data/menu";
import { useBilling } from "@/hooks/useBilling";
import type { Bill, PaymentMode } from "@/types/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import BillModal from "@/components/BillModal";

export default function BillingScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount,
    tableNumber, setTableNumber,
    discountPercent, setDiscountPercent,
    gstPercent, setGstPercent,
    paymentMode, setPaymentMode,
    subtotal, discountAmount, gstAmount, grandTotal,
    generateBill
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
    if (cart.length > 0) {
      if (window.confirm("Clear current cart and start a new bill?")) {
        clearCart();
      }
    }
  };

  const handleModalNewBill = () => {
    clearCart();
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] md:flex-row bg-background font-sans overflow-hidden">
      {/* Main Content Area (Menu & Categories) */}
      <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shadow-md z-10 shrink-0">
          <div className="flex items-center gap-2">
            <Music2 className="w-6 h-6" />
            <h1 className="text-xl font-serif font-bold tracking-tight">Gaan Fun Khaan</h1>
          </div>
          <div className="md:hidden bg-white/20 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <span data-testid="badge-cart-count">{cartCount}</span> items
          </div>
        </header>

        {/* Categories */}
        <div className="px-4 py-3 overflow-x-auto shrink-0 hide-scrollbar border-b bg-card">
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                data-testid={`tab-category-${cat}`}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-bold transition-colors whitespace-nowrap text-sm ${
                  activeCategory === cat 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar pb-[280px] md:pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMenu.map(item => {
              const cartItem = cart.find(c => c.menuItemId === item.id);
              return (
                <button
                  key={item.id}
                  data-testid={`card-menuitem-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className="relative flex flex-col justify-between text-left p-4 rounded-xl border-2 border-transparent bg-card shadow-sm hover:border-primary/20 hover:shadow-md transition-all min-h-[88px] active:scale-95 active:ring-2 active:ring-primary/50"
                >
                  {cartItem && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-sm z-10">
                      {cartItem.quantity}
                    </div>
                  )}
                  <div className="font-serif font-semibold text-card-foreground leading-snug line-clamp-2">
                    {item.name}
                  </div>
                  <div className="mt-2 text-primary font-bold">
                    {item.price === null ? "Price on Request" : `₹${item.price.toFixed(2)}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart Panel (Pinned to bottom on mobile, right side on desktop) */}
      <div className="fixed bottom-0 left-0 right-0 h-[280px] md:static md:w-[400px] lg:w-[450px] bg-card border-t md:border-l flex flex-col shadow-xl z-20 md:h-[100dvh] shrink-0 rounded-t-2xl md:rounded-none">
        
        <div className="px-5 py-4 border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-foreground">Current Order</h2>
            <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
              {cartCount} items
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNewBill} className="text-destructive hover:text-destructive hover:bg-destructive/10" data-testid="btn-clear-cart">
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-2 hide-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Music2 className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium">No items yet</p>
            </div>
          ) : (
            <div className="space-y-2 px-3 pb-4">
              {cart.map(item => (
                <div key={item.menuItemId} className="flex items-center py-2 bg-muted/30 p-3 rounded-lg" data-testid={`row-cartitem-${item.menuItemId}`}>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-semibold text-foreground truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">₹{item.price.toFixed(2)}</div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-card border rounded-full overflow-hidden shadow-sm">
                      <button 
                        className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        data-testid={`btn-dec-${item.menuItemId}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm tabular-nums">{item.quantity}</span>
                      <button 
                        className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        data-testid={`btn-inc-${item.menuItemId}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="w-16 text-right font-bold tabular-nums text-sm">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                    
                    <button 
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                      onClick={() => removeFromCart(item.menuItemId)}
                      data-testid={`btn-remove-${item.menuItemId}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer (Totals & Payment) - NEVER SCROLLS */}
        <div className="bg-card border-t p-3 md:p-5 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          
          <div className="flex gap-2 mb-3 hidden md:flex">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="table" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Table No.</Label>
              <Input
                id="table"
                type="text"
                placeholder="e.g. T1, T2"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="bg-muted border-transparent focus-visible:ring-primary h-10"
                data-testid="input-table-number"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="discount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Discount %</Label>
              <Input 
                id="discount"
                type="number" 
                min="0" 
                max="100" 
                value={discountPercent || ""} 
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="bg-muted border-transparent focus-visible:ring-primary h-10"
                data-testid="input-discount"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="gst" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GST %</Label>
              <Input 
                id="gst"
                type="number" 
                min="0" 
                max="100" 
                value={gstPercent || ""} 
                onChange={(e) => setGstPercent(Number(e.target.value))}
                className="bg-muted border-transparent focus-visible:ring-primary h-10"
                data-testid="input-gst"
              />
            </div>
          </div>

          <div className="flex md:hidden gap-2 mb-3">
             <Input
                id="table-m"
                type="text"
                placeholder="Table No"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="bg-muted border-transparent focus-visible:ring-primary h-9 text-xs flex-1"
                data-testid="input-table-number"
              />
              <Input 
                id="discount-m"
                type="number" 
                placeholder="Disc %"
                min="0" 
                max="100" 
                value={discountPercent || ""} 
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="bg-muted border-transparent focus-visible:ring-primary h-9 text-xs w-20"
                data-testid="input-discount"
              />
              <Input 
                id="gst-m"
                type="number" 
                placeholder="GST %"
                min="0" 
                max="100" 
                value={gstPercent || ""} 
                onChange={(e) => setGstPercent(Number(e.target.value))}
                className="bg-muted border-transparent focus-visible:ring-primary h-9 text-xs w-20"
                data-testid="input-gst"
              />
          </div>

          <div className="space-y-1 md:space-y-1.5 hidden md:block">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>Discount</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {gstAmount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>GST</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center py-2 md:pt-3 md:mt-2 md:border-t">
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg md:text-xl">Total</span>
              {(discountAmount > 0 || gstAmount > 0) && <span className="text-xs text-muted-foreground md:hidden">inc. taxes/disc</span>}
            </div>
            <span className="font-sans font-black text-2xl md:text-3xl text-primary tabular-nums tracking-tight">₹{grandTotal.toFixed(2)}</span>
          </div>

          <div className="pt-2 md:pt-3 flex flex-col md:flex-row gap-3">
            <ToggleGroup 
              type="single" 
              value={paymentMode} 
              onValueChange={(v) => v && setPaymentMode(v as PaymentMode)}
              className="justify-start gap-1 md:gap-2 bg-muted p-1 rounded-xl flex-1"
            >
              {(["Cash", "UPI", "Card"] as const).map(mode => (
                <ToggleGroupItem 
                  key={mode} 
                  value={mode} 
                  className={`flex-1 rounded-lg font-bold text-xs md:text-sm data-[state=on]:bg-white data-[state=on]:text-primary data-[state=on]:shadow-sm transition-all h-10 md:h-12`}
                  data-testid={`toggle-payment-${mode}`}
                >
                  {mode}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <Button 
              className="w-full md:w-auto md:px-8 h-10 md:h-12 text-sm md:text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
              disabled={cart.length === 0}
              onClick={handleGenerateBill}
              data-testid="btn-generate-bill"
            >
              GENERATE BILL
            </Button>
          </div>
        </div>
      </div>

      <BillModal 
        bill={generatedBill} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onNewBill={handleModalNewBill}
      />
    </div>
  );
}