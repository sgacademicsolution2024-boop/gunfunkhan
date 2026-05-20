import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Minus, Package, Plus, Save, Search } from "lucide-react";
import type { PosMenuItem, RestaurantSettings } from "@/types/billing";
import { MENU_ITEMS } from "@/data/menu";
import { addInventoryMovement, createMenuItem, defaultRestaurantSettings, getMenuItems, getMyRestaurant, updateMenuItem } from "@/lib/posApi";
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
  minStockQty: 5,
  trackStock: true,
  isAvailable: true,
}));

const LOCAL_INVENTORY_KEY = "gfk_inventory_items";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getLocalInventory(): PosMenuItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_INVENTORY_KEY);
    return raw ? JSON.parse(raw) : fallbackItems;
  } catch {
    return fallbackItems;
  }
}

function saveLocalInventory(items: PosMenuItem[]) {
  localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(items));
}

export default function InventoryScreen() {
  const [restaurant, setRestaurant] = useState<RestaurantSettings>(defaultRestaurantSettings);
  const [items, setItems] = useState<PosMenuItem[]>(() => getLocalInventory());
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [draftItem, setDraftItem] = useState({
    name: "",
    category: "Snacks",
    price: "",
    stockQty: "0",
    minStockQty: "0",
    trackStock: true,
  });

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
      if (cloudItems.length > 0) {
        setItems(cloudItems);
        setNotice("");
      } else {
        const localItems = getLocalInventory();
        setItems(localItems);
        setNotice("Using local inventory until Supabase menu items are seeded. First edit will create that item in Supabase.");
      }
    } catch (error) {
      setItems(getLocalInventory());
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
    setItems((current) => {
      const updated = current.map((item) => (item.id === nextItem.id ? nextItem : item));
      if (!restaurant.id || !UUID_PATTERN.test(nextItem.id)) saveLocalInventory(updated);
      return updated;
    });

    if (!restaurant.id) {
      setNotice("Inventory changes are shown locally. Connect Supabase and save restaurant settings to persist them.");
      return;
    }

    try {
      const savedItem = UUID_PATTERN.test(nextItem.id)
        ? await updateMenuItem(restaurant.id, nextItem)
        : await createMenuItem(restaurant.id, {
            name: nextItem.name,
            category: nextItem.category,
            price: nextItem.price,
            stockQty: nextItem.stockQty,
            minStockQty: nextItem.minStockQty,
            trackStock: nextItem.trackStock,
            isAvailable: nextItem.isAvailable,
          });

      setItems((current) => {
        const updated = current.map((item) => (item.id === nextItem.id ? savedItem : item));
        saveLocalInventory(updated);
        return updated;
      });

      if (movement && movement.quantity !== 0 && savedItem.trackStock) {
        await addInventoryMovement(restaurant.id, {
          menu_item_id: savedItem.id,
          movement_type: movement.type,
          quantity: movement.quantity,
          note: movement.note,
        });
      }
      setNotice("Inventory saved.");
    } catch (error) {
      saveLocalInventory(items.map((item) => (item.id === nextItem.id ? nextItem : item)));
      setNotice(error instanceof Error ? `Saved locally. Supabase issue: ${error.message}` : "Saved locally. Could not sync inventory change.");
    }
  }

  function changeStock(item: PosMenuItem, direction: "add" | "reduce") {
    const qty = Number(stockInputs[item.id] || 1);
    if (!Number.isFinite(qty) || qty <= 0) {
      setNotice("Enter a stock quantity greater than 0.");
      return;
    }

    const signedQty = direction === "add" ? qty : -qty;
    saveItem(
      { ...item, stockQty: item.stockQty + signedQty },
      { type: direction, quantity: signedQty, note: direction === "add" ? "Manual stock add" : "Manual stock reduce" },
    );
    setStockInputs((current) => ({ ...current, [item.id]: "1" }));
  }

  function adjustMinimum(item: PosMenuItem) {
    const input = window.prompt("Minimum stock warning level", String(item.minStockQty));
    const minStockQty = Number(input);
    if (input === null || !Number.isFinite(minStockQty) || minStockQty < 0) return;
    saveItem({ ...item, minStockQty }, { type: "adjust", quantity: 0, note: "Minimum stock updated" });
  }

  async function addNewItem() {
    if (!draftItem.name.trim()) {
      setNotice("Enter an item name first.");
      return;
    }

    const nextItem: Omit<PosMenuItem, "id"> = {
      name: draftItem.name.trim(),
      category: draftItem.category.trim() || "Other",
      price: draftItem.price === "" ? null : Number(draftItem.price),
      stockQty: Number(draftItem.stockQty || 0),
      minStockQty: Number(draftItem.minStockQty || 0),
      trackStock: draftItem.trackStock,
      isAvailable: true,
    };

    if (!Number.isFinite(nextItem.price ?? 0) || !Number.isFinite(nextItem.stockQty) || !Number.isFinite(nextItem.minStockQty)) {
      setNotice("Check price and stock numbers.");
      return;
    }

    if (!restaurant.id) {
      const localItem = { ...nextItem, id: `local-${Date.now()}` };
      setItems((current) => {
        const updated = [localItem, ...current];
        saveLocalInventory(updated);
        return updated;
      });
      setNotice("Item added locally. Save restaurant settings and seed Supabase to persist menu changes.");
    } else {
      try {
        const saved = await createMenuItem(restaurant.id, nextItem);
        setItems((current) => {
          const updated = [saved, ...current];
          saveLocalInventory(updated);
          return updated;
        });
        if (saved.trackStock && saved.stockQty > 0) {
          await addInventoryMovement(restaurant.id, {
            menu_item_id: saved.id,
            movement_type: "add",
            quantity: saved.stockQty,
            note: "Opening stock",
          });
        }
        setNotice("Menu item added.");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not add menu item.");
      }
    }

    setDraftItem({ name: "", category: "Snacks", price: "", stockQty: "0", minStockQty: "0", trackStock: true });
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      <header className="sticky top-0 z-10 bg-primary px-4 py-3 pr-4 text-primary-foreground shadow-md md:pr-[470px] lg:pr-[560px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
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

      <main className="mx-auto max-w-6xl space-y-4 p-3 sm:p-4 xl:p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Summary label="Items" value={String(items.length)} />
          <Summary label="Tracked" value={String(items.filter((item) => item.trackStock).length)} />
          <Summary label="Low Stock" value={String(lowStockCount)} danger={lowStockCount > 0} />
          <Summary label="Hidden" value={String(items.filter((item) => !item.isAvailable).length)} />
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-lg font-bold">Add Menu Item</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <Input
              value={draftItem.name}
              onChange={(event) => setDraftItem((current) => ({ ...current, name: event.target.value }))}
              placeholder="Item name"
              className="lg:col-span-2"
            />
            <Input
              value={draftItem.category}
              onChange={(event) => setDraftItem((current) => ({ ...current, category: event.target.value }))}
              placeholder="Category"
            />
            <Input
              type="number"
              value={draftItem.price}
              onChange={(event) => setDraftItem((current) => ({ ...current, price: event.target.value }))}
              placeholder="Price"
            />
            <Input
              type="number"
              value={draftItem.stockQty}
              onChange={(event) => setDraftItem((current) => ({ ...current, stockQty: event.target.value }))}
              placeholder="Stock"
            />
            <Input
              type="number"
              value={draftItem.minStockQty}
              onChange={(event) => setDraftItem((current) => ({ ...current, minStockQty: event.target.value }))}
              placeholder="Min"
            />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm font-bold sm:min-w-48">
              Track stock
              <Switch
                checked={draftItem.trackStock}
                onCheckedChange={(trackStock) => setDraftItem((current) => ({ ...current, trackStock }))}
              />
            </label>
            <Button onClick={addNewItem} className="sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

                <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={stockInputs[item.id] ?? "1"}
                    onChange={(event) => setStockInputs((current) => ({ ...current, [item.id]: event.target.value }))}
                    className="h-10 bg-white text-center font-bold tabular-nums"
                    disabled={!item.trackStock}
                    aria-label={`Stock quantity for ${item.name}`}
                  />
                  <Button variant="outline" onClick={() => changeStock(item, "reduce")} disabled={!item.trackStock}>
                    <Minus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Reduce</span>
                  </Button>
                  <Button onClick={() => changeStock(item, "add")} disabled={!item.trackStock}>
                    <Plus className="h-4 w-4 sm:mr-1" />
                    Add
                  </Button>
                </div>
                <Button variant="outline" onClick={() => adjustMinimum(item)} className="mt-2 w-full">
                  <Package className="mr-1 h-4 w-4" />
                  Set Minimum Stock
                </Button>
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

function Summary({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-sm ${danger ? "border-destructive/30" : ""}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums ${danger ? "text-destructive" : "text-primary"}`}>{value}</p>
    </div>
  );
}
