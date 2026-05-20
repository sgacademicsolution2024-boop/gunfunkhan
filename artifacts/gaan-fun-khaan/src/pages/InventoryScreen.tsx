import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Minus, Package, Plus, Search } from "lucide-react";
import type { PosMenuItem, RestaurantSettings } from "@/types/billing";
import { MENU_ITEMS } from "@/data/menu";
import { addInventoryMovement, defaultRestaurantSettings, getMenuItems, getMyRestaurant, updateMenuItem } from "@/lib/posApi";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const fallbackItems: PosMenuItem[] = MENU_ITEMS.map((item) => ({
  id: item.id,
  name: item.name,
  price: item.price,
  category: item.category,
  stockQty: 0,
  minStockQty: 0,
  trackStock: false,
  isAvailable: true,
}));

export default function InventoryScreen() {
  const [restaurant, setRestaurant] = useState<RestaurantSettings>(defaultRestaurantSettings);
  const [items, setItems] = useState<PosMenuItem[]>(fallbackItems);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      const cloudRestaurant = await getMyRestaurant();
      if (!cloudRestaurant) {
        setNotice("Save restaurant settings in Supabase before cloud inventory is available.");
        return;
      }

      setRestaurant(cloudRestaurant);
      const cloudItems = await getMenuItems(cloudRestaurant.id);
      setItems(cloudItems.length > 0 ? cloudItems : fallbackItems);
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Inventory is using local demo items.");
    }
  }

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      [item.name, item.category].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [items, query]);

  const lowStockCount = items.filter((item) => item.trackStock && item.stockQty <= item.minStockQty).length;

  async function saveItem(nextItem: PosMenuItem, movement?: { type: "add" | "reduce" | "adjust"; quantity: number; note: string }) {
    setItems((current) => current.map((item) => (item.id === nextItem.id ? nextItem : item)));

    if (!restaurant.id) {
      setNotice("Inventory changes are shown locally. Connect Supabase and save restaurant settings to persist them.");
      return;
    }

    try {
      await updateMenuItem(restaurant.id, nextItem);
      if (movement && movement.quantity !== 0) {
        await addInventoryMovement(restaurant.id, {
          menu_item_id: nextItem.id,
          movement_type: movement.type,
          quantity: movement.quantity,
          note: movement.note,
        });
      }
      setNotice("Inventory saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save inventory change.");
      await loadInventory();
    }
  }

  function changeStock(item: PosMenuItem, direction: "add" | "reduce") {
    const input = window.prompt(direction === "add" ? "Quantity to add" : "Quantity to reduce", "1");
    const qty = Number(input);
    if (!input || !Number.isFinite(qty) || qty <= 0) return;

    const signedQty = direction === "add" ? qty : -qty;
    saveItem(
      { ...item, stockQty: item.stockQty + signedQty },
      { type: direction, quantity: signedQty, note: direction === "add" ? "Manual stock add" : "Manual stock reduce" },
    );
  }

  function adjustMinimum(item: PosMenuItem) {
    const input = window.prompt("Minimum stock warning level", String(item.minStockQty));
    const minStockQty = Number(input);
    if (input === null || !Number.isFinite(minStockQty) || minStockQty < 0) return;
    saveItem({ ...item, minStockQty }, { type: "adjust", quantity: 0, note: "Minimum stock updated" });
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      <header className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" className="shadow-sm" />
            <div>
              <h1 className="font-serif text-lg font-bold">Inventory</h1>
              <p className="text-xs font-semibold text-white/75">{restaurant.name}</p>
            </div>
          </div>
          <div className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">{lowStockCount} low</div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search item or category"
            className="h-11 rounded-xl bg-card pl-9"
          />
        </div>

        {notice && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {notice}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {filteredItems.map((item) => {
            const lowStock = item.trackStock && item.stockQty <= item.minStockQty;
            return (
              <div key={item.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-bold text-foreground">{item.name}</h2>
                      {lowStock && <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />}
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">{item.category}</p>
                  </div>
                  <div className={`rounded-full px-2.5 py-1 text-xs font-black ${item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {item.isAvailable ? "Available" : "Hidden"}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Metric label="Stock" value={String(item.stockQty)} />
                  <Metric label="Minimum" value={String(item.minStockQty)} />
                  <Metric label="Price" value={item.price === null ? "Open" : `Rs ${item.price}`} />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm font-bold">Track stock</span>
                  <Switch checked={item.trackStock} onCheckedChange={(trackStock) => saveItem({ ...item, trackStock })} />
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm font-bold">Available for billing</span>
                  <Switch checked={item.isAvailable} onCheckedChange={(isAvailable) => saveItem({ ...item, isAvailable })} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Button variant="outline" onClick={() => changeStock(item, "reduce")} disabled={!item.trackStock}>
                    <Minus className="mr-1 h-4 w-4" />
                    Reduce
                  </Button>
                  <Button variant="outline" onClick={() => adjustMinimum(item)}>
                    <Package className="mr-1 h-4 w-4" />
                    Min
                  </Button>
                  <Button onClick={() => changeStock(item, "add")} disabled={!item.trackStock}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-2">
      <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-black tabular-nums text-foreground">{value}</p>
    </div>
  );
}
