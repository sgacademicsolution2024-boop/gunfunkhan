import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Minus, Music2, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { MENU_ITEMS } from "@/data/menu";
import { useBilling } from "@/hooks/useBilling";
import type { Bill, PaymentMode, PosMenuItem, RestaurantSettings } from "@/types/billing";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import BillModal from "@/components/BillModal";
import Logo from "@/components/Logo";
import { defaultRestaurantSettings, getMenuItems, getMyRestaurant } from "@/lib/posApi";

const fallbackMenu: PosMenuItem[] = MENU_ITEMS.map((item) => ({
  id: item.id,
  name: item.name,
  price: item.price,
  category: item.category,
  stockQty: 0,
  minStockQty: 0,
  trackStock: false,
  isAvailable: true,
}));

export default function BillingScreen() {
  const [restaurant, setRestaurant] = useState<RestaurantSettings>(defaultRestaurantSettings);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>(fallbackMenu);
  const [activeCategory, setActiveCategory] = useState("All");
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"menu" | "cart">("menu");
  const [isSaving, setIsSaving] = useState(false);
  const [syncNotice, setSyncNotice] = useState("");

  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    tableNumber,
    setTableNumber,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    discountPercent,
    setDiscountPercent,
    gstPercent,
    setGstPercent,
    serviceChargePercent,
    setServiceChargePercent,
    paymentMode,
    setPaymentMode,
    subtotal,
    discountAmount,
    gstAmount,
    serviceChargeAmount,
    grandTotal,
    generateBill,
  } = useBilling(restaurant);

  useEffect(() => {
    let isMounted = true;

    async function loadCloudData() {
      try {
        const cloudRestaurant = await getMyRestaurant();
        if (!isMounted || !cloudRestaurant) return;

        setRestaurant(cloudRestaurant);
        const cloudMenu = await getMenuItems(cloudRestaurant.id);
        if (isMounted && cloudMenu.length > 0) setMenuItems(cloudMenu);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Using local menu until Supabase is ready.";
        if (isMounted) setSyncNotice(message);
      }
    }

    loadCloudData();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(menuItems.map((item) => item.category)))],
    [menuItems],
  );

  const filteredMenu =
    activeCategory === "All" ? menuItems : menuItems.filter((item) => item.category === activeCategory);

  const handleItemClick = (item: PosMenuItem) => {
    if (!item.isAvailable) return;
    if (item.trackStock && item.stockQty <= 0) {
      window.alert(`${item.name} is out of stock.`);
      return;
    }

    let price = item.price;
    if (price === null) {
      const input = window.prompt(`Enter price for ${item.name}:`);
      if (!input || isNaN(Number(input))) return;
      price = Number(input);
    }

    addToCart({ id: item.id, name: item.name, price });
  };

  const handleGenerateBill = async () => {
    if (cart.length === 0) return;
    setIsSaving(true);
    const bill = await generateBill();
    setIsSaving(false);
    setGeneratedBill(bill);
    setIsModalOpen(true);

    if (bill.syncError) {
      setSyncNotice(`Saved locally. Supabase sync issue: ${bill.syncError}`);
    }
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
    <div className="flex h-full flex-col bg-card">
      <div className="flex shrink-0 items-center justify-between border-b bg-card px-4 py-3">
        <button
          onClick={() => setMobileView("menu")}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground md:hidden"
          data-testid="btn-back-to-menu"
        >
          <ArrowLeft className="h-4 w-4" />
          Menu
        </button>
        <h2 className="font-serif text-lg font-bold text-foreground">
          Current Order
          {cartCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 align-middle text-xs font-bold text-primary-foreground">
              {cartCount}
            </span>
          )}
        </h2>
        <button
          onClick={handleNewBill}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
          data-testid="btn-clear-cart"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </button>
      </div>

      <div className="hide-scrollbar flex-1 overflow-y-auto px-3 py-2">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Music2 className="h-8 w-8 opacity-40" />
            </div>
            <p className="font-semibold">No items yet</p>
            <p className="text-sm">Tap items from the menu to add them here.</p>
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            {cart.map((item) => (
              <div
                key={item.menuItemId}
                className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5"
                data-testid={`row-cartitem-${item.menuItemId}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold leading-tight text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">Rs {item.price.toFixed(2)} each</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="flex items-center rounded-full border bg-card shadow-sm">
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      data-testid={`btn-dec-${item.menuItemId}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      data-testid={`btn-inc-${item.menuItemId}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-16 text-right text-sm font-bold tabular-nums">
                    Rs {(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeFromCart(item.menuItemId)}
                    data-testid={`btn-remove-${item.menuItemId}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t bg-card px-3 pb-4 pt-3 sm:px-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Field label="Table">
            <Input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="T1" className="h-9 border-transparent bg-muted text-sm" />
          </Field>
          <Field label="Customer">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Name" className="h-9 border-transparent bg-muted text-sm" />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Mobile" className="h-9 border-transparent bg-muted text-sm" />
          </Field>
          <Field label="Discount %">
            <Input type="number" min="0" max="100" value={discountPercent || ""} onChange={(e) => setDiscountPercent(Number(e.target.value))} placeholder="0" className="h-9 border-transparent bg-muted text-sm" />
          </Field>
          <Field label="GST %">
            <Input type="number" min="0" max="100" value={gstPercent || ""} onChange={(e) => setGstPercent(Number(e.target.value))} placeholder="0" className="h-9 border-transparent bg-muted text-sm" />
          </Field>
          <Field label="Service %">
            <Input type="number" min="0" max="100" value={serviceChargePercent || ""} onChange={(e) => setServiceChargePercent(Number(e.target.value))} placeholder="0" className="h-9 border-transparent bg-muted text-sm" />
          </Field>
        </div>

        <div className="space-y-1 text-sm">
          <TotalRow label="Subtotal" value={subtotal} />
          {discountAmount > 0 && <TotalRow label={`Discount (${discountPercent}%)`} value={-discountAmount} tone="success" />}
          {gstAmount > 0 && <TotalRow label={`GST (${gstPercent}%)`} value={gstAmount} />}
          {serviceChargeAmount > 0 && <TotalRow label={`Service (${serviceChargePercent}%)`} value={serviceChargeAmount} />}
          <div className="flex items-center justify-between border-t pt-1.5">
            <span className="font-serif text-lg font-bold">Grand Total</span>
            <span className="text-2xl font-black tabular-nums text-primary">Rs {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <ToggleGroup
          type="single"
          value={paymentMode}
          onValueChange={(value) => value && setPaymentMode(value as PaymentMode)}
          className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1"
        >
          {(["Cash", "UPI", "Card"] as const).map((mode) => (
            <ToggleGroupItem
              key={mode}
              value={mode}
              className="h-10 rounded-lg text-sm font-bold transition-all data-[state=on]:bg-white data-[state=on]:text-primary data-[state=on]:shadow-sm"
              data-testid={`toggle-payment-${mode}`}
            >
              {mode}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <button
          onClick={handleGenerateBill}
          disabled={cart.length === 0 || isSaving}
          className="h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="btn-generate-bill"
        >
          {isSaving ? "SAVING BILL..." : "GENERATE BILL"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden h-screen overflow-hidden bg-background md:flex">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex min-h-14 shrink-0 items-center gap-3 bg-primary px-5 py-2.5 pr-[460px] text-primary-foreground shadow-md lg:pr-[560px]">
            <Logo size="md" className="shadow-sm" />
            <h1 className="font-serif text-xl font-bold tracking-tight">{restaurant.name}</h1>
          </header>

          <CategoryTabs categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

          <div className="hide-scrollbar flex-1 overflow-y-auto p-4 xl:p-5">
            <MenuGrid items={filteredMenu} cart={cart} onItemClick={handleItemClick} desktop />
          </div>
        </div>
        <div className="h-full w-[360px] shrink-0 overflow-hidden border-l shadow-xl lg:w-[390px] xl:w-[430px]">{CartPanel}</div>
      </div>

      <div className="flex h-[100dvh] flex-col overflow-hidden bg-background md:hidden">
        {mobileView === "menu" ? (
          <>
            <header className="flex min-h-14 shrink-0 items-center justify-between bg-primary px-4 py-2 text-primary-foreground shadow-md">
              <div className="flex min-w-0 items-center gap-2.5">
                <Logo size="sm" className="shadow-sm" />
                <h1 className="truncate font-serif text-base font-bold">{restaurant.name}</h1>
              </div>
              {cartCount > 0 && (
                <button
                  onClick={() => setMobileView("cart")}
                  className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold transition-colors active:scale-95"
                  data-testid="btn-open-cart"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount}
                </button>
              )}
            </header>

            <CategoryTabs categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

            <div className="hide-scrollbar flex-1 overflow-y-auto p-3 pb-[76px]">
              <MenuGrid items={filteredMenu} cart={cart} onItemClick={handleItemClick} />
            </div>

            {cartCount > 0 && (
              <div className="fixed bottom-16 left-0 right-0 z-30 px-3 pb-2">
                <button
                  onClick={() => setMobileView("cart")}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground shadow-xl transition-all active:scale-[0.98]"
                  data-testid="btn-cart-strip"
                >
                  <div className="flex items-center gap-2 font-bold">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="whitespace-nowrap">{cartCount} {cartCount === 1 ? "item" : "items"}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-lg font-black tabular-nums">Rs {grandTotal.toFixed(2)}</span>
                    <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-sm font-bold">View</span>
                  </div>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col overflow-hidden pb-16">{CartPanel}</div>
        )}
      </div>

      <BillModal
        bill={generatedBill}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNewBill={handleModalNewBill}
      />

      {syncNotice && (
        <div className="fixed bottom-20 left-3 right-3 z-50 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-lg md:bottom-4 md:left-auto md:w-[420px]">
          {syncNotice}
          <button className="float-right ml-3 text-amber-700" onClick={() => setSyncNotice("")}>Dismiss</button>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function TotalRow({ label, value, tone }: { label: string; value: number; tone?: "success" }) {
  return (
    <div className={`flex justify-between ${tone === "success" ? "font-medium text-emerald-600" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value < 0 ? "-" : ""}Rs {Math.abs(value).toFixed(2)}</span>
    </div>
  );
}

function CategoryTabs({
  categories,
  activeCategory,
  setActiveCategory,
}: {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}) {
  return (
    <div className="hide-scrollbar shrink-0 overflow-x-auto border-b bg-card px-3 py-2.5 md:px-4 md:py-3">
      <div className="flex min-w-max gap-2">
        {categories.map((category) => (
          <button
            key={category}
            data-testid={`tab-category-${category}`}
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors md:px-5 ${
              activeCategory === category ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

function MenuGrid({
  items,
  cart,
  onItemClick,
  desktop = false,
}: {
  items: PosMenuItem[];
  cart: { menuItemId: string; quantity: number }[];
  onItemClick: (item: PosMenuItem) => void;
  desktop?: boolean;
}) {
  return (
    <div className={desktop ? "grid grid-cols-3 gap-3 lg:grid-cols-4 2xl:grid-cols-5" : "grid grid-cols-2 gap-3 min-[420px]:grid-cols-3"}>
      {items.map((item) => {
        const cartItem = cart.find((entry) => entry.menuItemId === item.id);
        const disabled = !item.isAvailable || (item.trackStock && item.stockQty <= 0);

        return (
          <button
            key={item.id}
            data-testid={`card-menuitem-${item.id}`}
            onClick={() => onItemClick(item)}
            disabled={disabled}
            className={`relative flex min-h-[92px] flex-col justify-between border-2 border-transparent bg-card p-3.5 text-left shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 sm:p-4 ${
              desktop ? "rounded-xl hover:border-primary/20 hover:shadow-md" : "rounded-2xl active:border-primary/30"
            }`}
          >
            {cartItem && (
              <span className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
                {cartItem.quantity}
              </span>
            )}
            <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{item.name}</span>
            <span className="mt-2 text-sm font-bold text-primary">
              {item.price === null ? "On Request" : `Rs ${item.price.toFixed(2)}`}
            </span>
            {item.trackStock && (
              <span className={`mt-1 text-[10px] font-bold ${item.stockQty <= item.minStockQty ? "text-destructive" : "text-muted-foreground"}`}>
                Stock {item.stockQty}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
