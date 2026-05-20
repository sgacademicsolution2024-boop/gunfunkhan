import type { Bill, CartItem, PaymentMode, PosMenuItem, RestaurantSettings } from "@/types/billing";
import { getSupabaseClient } from "@/lib/supabase";

type RestaurantRow = {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  gstin: string | null;
  logo_url: string | null;
  tax_rate: number | null;
  service_charge_rate: number | null;
  currency: string | null;
};

type MenuItemRow = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  price: number | null;
  stock_qty: number | null;
  min_stock_qty: number | null;
  track_stock: boolean | null;
  is_available: boolean | null;
  menu_categories?: { name: string | null } | null;
};

type OrderRow = {
  id: string;
  restaurant_id: string;
  order_no: number;
  invoice_no: string;
  created_at: string;
  table_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  service_charge_rate: number;
  service_charge_amount: number;
  grand_total: number;
  payment_mode: PaymentMode;
  order_items?: OrderItemRow[];
};

type OrderItemRow = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type InventoryMovement = {
  id: string;
  restaurant_id: string;
  menu_item_id: string;
  movement_type: "sale" | "add" | "reduce" | "adjust";
  quantity: number;
  note: string | null;
  created_at: string;
};

export const defaultRestaurantSettings: RestaurantSettings = {
  name: "Gaan Fun Khaan",
  phone: "",
  address: "Darjeeling Hills",
  gstin: "",
  logoUrl: "/restaurant-logo.jpg",
  taxRate: 0,
  serviceChargeRate: 0,
  currency: "INR",
};

function requireRestaurantId(restaurantId?: string): string {
  if (!restaurantId) {
    throw new Error("Restaurant profile was not found. Save restaurant settings after signing in to Supabase.");
  }

  return restaurantId;
}

function mapRestaurant(row: RestaurantRow): RestaurantSettings {
  return {
    id: row.id,
    name: row.name || defaultRestaurantSettings.name,
    phone: row.phone || "",
    address: row.address || "",
    gstin: row.gstin || "",
    logoUrl: row.logo_url || defaultRestaurantSettings.logoUrl,
    taxRate: Number(row.tax_rate ?? 0),
    serviceChargeRate: Number(row.service_charge_rate ?? 0),
    currency: row.currency || defaultRestaurantSettings.currency,
  };
}

function mapMenuItem(row: MenuItemRow): PosMenuItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price === null ? null : Number(row.price),
    category: row.menu_categories?.name || "Other",
    stockQty: Number(row.stock_qty ?? 0),
    minStockQty: Number(row.min_stock_qty ?? 0),
    trackStock: Boolean(row.track_stock),
    isAvailable: row.is_available !== false,
  };
}

function mapOrder(row: OrderRow): Bill {
  return {
    id: row.invoice_no,
    orderId: row.id,
    billNumber: row.order_no,
    date: row.created_at,
    tableNumber: row.table_number || "",
    customerName: row.customer_name || "",
    customerPhone: row.customer_phone || "",
    items: (row.order_items || []).map((item) => ({
      menuItemId: item.menu_item_id || item.id,
      name: item.item_name,
      price: Number(item.unit_price),
      quantity: Number(item.quantity),
    })),
    subtotal: Number(row.subtotal),
    discountPercent: Number(row.discount_percent),
    discountAmount: Number(row.discount_amount),
    gstPercent: Number(row.tax_rate),
    gstAmount: Number(row.tax_amount),
    serviceChargePercent: Number(row.service_charge_rate),
    serviceChargeAmount: Number(row.service_charge_amount),
    grandTotal: Number(row.grand_total),
    paymentMode: row.payment_mode,
    syncStatus: "synced",
  };
}

async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!data.user) {
    throw new Error("Supabase is configured, but no user is signed in. Sign in before using cloud sync.");
  }

  return data.user.id;
}

export async function getMyRestaurant(): Promise<RestaurantSettings | null> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle<RestaurantRow>();

  if (error) throw error;
  return data ? mapRestaurant(data) : null;
}

export async function updateRestaurantSettings(settings: RestaurantSettings): Promise<RestaurantSettings> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const payload = {
    owner_id: userId,
    name: settings.name,
    phone: settings.phone,
    address: settings.address,
    gstin: settings.gstin,
    logo_url: settings.logoUrl,
    tax_rate: settings.taxRate,
    service_charge_rate: settings.serviceChargeRate,
    currency: settings.currency,
  };

  const upsertPayload: typeof payload & { id?: string } = settings.id
    ? { ...payload, id: settings.id }
    : payload;

  const { data, error } = await supabase
    .from("restaurants")
    .upsert(upsertPayload, { onConflict: "owner_id" })
    .select("*")
    .single<RestaurantRow>();

  if (error) throw error;
  return mapRestaurant(data);
}

export async function getMenuItems(restaurantId?: string): Promise<PosMenuItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, menu_categories(name)")
    .eq("restaurant_id", requireRestaurantId(restaurantId))
    .order("name", { ascending: true })
    .returns<MenuItemRow[]>();

  if (error) throw error;
  return (data || []).map(mapMenuItem);
}

async function getOrCreateCategory(restaurantId: string, categoryName: string): Promise<string> {
  const supabase = getSupabaseClient();
  const name = categoryName || "Other";
  const { data: existing, error: findError } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("name", name)
    .maybeSingle<{ id: string }>();

  if (findError) throw findError;
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("menu_categories")
    .insert({ restaurant_id: restaurantId, name })
    .select("id")
    .single<{ id: string }>();

  if (error) throw error;
  return data.id;
}

export async function createMenuItem(restaurantId: string, item: Omit<PosMenuItem, "id">): Promise<PosMenuItem> {
  const supabase = getSupabaseClient();
  const categoryId = await getOrCreateCategory(restaurantId, item.category);
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      restaurant_id: restaurantId,
      category_id: categoryId,
      name: item.name,
      price: item.price,
      stock_qty: item.stockQty,
      min_stock_qty: item.minStockQty,
      track_stock: item.trackStock,
      is_available: item.isAvailable,
    })
    .select("*, menu_categories(name)")
    .single<MenuItemRow>();

  if (error) throw error;
  return mapMenuItem(data);
}

export async function updateMenuItem(restaurantId: string, item: PosMenuItem): Promise<PosMenuItem> {
  const supabase = getSupabaseClient();
  const categoryId = await getOrCreateCategory(restaurantId, item.category);
  const { data, error } = await supabase
    .from("menu_items")
    .update({
      category_id: categoryId,
      name: item.name,
      price: item.price,
      stock_qty: item.stockQty,
      min_stock_qty: item.minStockQty,
      track_stock: item.trackStock,
      is_available: item.isAvailable,
    })
    .eq("restaurant_id", restaurantId)
    .eq("id", item.id)
    .select("*, menu_categories(name)")
    .single<MenuItemRow>();

  if (error) throw error;
  return mapMenuItem(data);
}

export async function deleteMenuItem(restaurantId: string, id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("menu_items").delete().eq("restaurant_id", restaurantId).eq("id", id);
  if (error) throw error;
}

export async function saveOrder(restaurantId: string, bill: Bill): Promise<Bill> {
  const supabase = getSupabaseClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      order_no: bill.billNumber,
      invoice_no: bill.id,
      table_number: bill.tableNumber || null,
      customer_name: bill.customerName || null,
      customer_phone: bill.customerPhone || null,
      subtotal: bill.subtotal,
      discount_percent: bill.discountPercent,
      discount_amount: bill.discountAmount,
      tax_rate: bill.gstPercent,
      tax_amount: bill.gstAmount,
      service_charge_rate: bill.serviceChargePercent || 0,
      service_charge_amount: bill.serviceChargeAmount || 0,
      grand_total: bill.grandTotal,
      payment_mode: bill.paymentMode,
    })
    .select("*")
    .single<OrderRow>();

  if (orderError) throw orderError;

  const items = bill.items.map((item) => ({
    restaurant_id: restaurantId,
    order_id: order.id,
    menu_item_id: item.menuItemId,
    item_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    line_total: item.price * item.quantity,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(items);
  if (itemsError) throw itemsError;

  await reduceStockAfterOrder(restaurantId, order.id, bill.items);

  return { ...bill, orderId: order.id, syncStatus: "synced" };
}

export async function getOrders(restaurantId?: string): Promise<Bill[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("restaurant_id", requireRestaurantId(restaurantId))
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  if (error) throw error;
  return (data || []).map(mapOrder);
}

export async function getOrderItems(orderId: string): Promise<CartItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .returns<OrderItemRow[]>();

  if (error) throw error;
  return (data || []).map((item) => ({
    menuItemId: item.menu_item_id || item.id,
    name: item.item_name,
    price: Number(item.unit_price),
    quantity: Number(item.quantity),
  }));
}

export async function reduceStockAfterOrder(restaurantId: string, orderId: string, items: CartItem[]): Promise<void> {
  const supabase = getSupabaseClient();

  for (const item of items) {
    const { data: menuItem, error: itemError } = await supabase
      .from("menu_items")
      .select("id, stock_qty, track_stock")
      .eq("restaurant_id", restaurantId)
      .eq("id", item.menuItemId)
      .maybeSingle<{ id: string; stock_qty: number | null; track_stock: boolean | null }>();

    if (itemError) throw itemError;
    if (!menuItem?.track_stock) continue;

    const nextStock = Number(menuItem.stock_qty ?? 0) - item.quantity;
    const { error: stockError } = await supabase
      .from("menu_items")
      .update({ stock_qty: nextStock })
      .eq("restaurant_id", restaurantId)
      .eq("id", item.menuItemId);

    if (stockError) throw stockError;

    await addInventoryMovement(restaurantId, {
      menu_item_id: item.menuItemId,
      movement_type: "sale",
      quantity: -item.quantity,
      note: `Order ${orderId}`,
    });
  }
}

export async function addInventoryMovement(
  restaurantId: string,
  movement: Pick<InventoryMovement, "menu_item_id" | "movement_type" | "quantity" | "note">,
): Promise<InventoryMovement> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("inventory_movements")
    .insert({ restaurant_id: restaurantId, ...movement })
    .select("*")
    .single<InventoryMovement>();

  if (error) throw error;
  return data;
}

export async function getInventoryMovements(restaurantId?: string): Promise<InventoryMovement[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*")
    .eq("restaurant_id", requireRestaurantId(restaurantId))
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<InventoryMovement[]>();

  if (error) throw error;
  return data || [];
}
