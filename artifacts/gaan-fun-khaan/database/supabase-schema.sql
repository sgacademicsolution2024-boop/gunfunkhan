-- Gaan Fun Khaan POS Supabase schema
-- Paste this file into the Supabase SQL Editor. Do not expose service-role keys in the app.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Gaan Fun Khaan',
  phone text,
  address text,
  gstin text,
  logo_url text,
  tax_rate numeric(6,2) not null default 0,
  service_charge_rate numeric(6,2) not null default 0,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  price numeric(12,2),
  stock_qty numeric(12,2) not null default 0,
  min_stock_qty numeric(12,2) not null default 0,
  track_stock boolean not null default false,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_no integer not null,
  invoice_no text not null,
  table_number text,
  customer_name text,
  customer_phone text,
  subtotal numeric(12,2) not null default 0,
  discount_percent numeric(6,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_rate numeric(6,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  service_charge_rate numeric(6,2) not null default 0,
  service_charge_amount numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  payment_mode text not null check (payment_mode in ('Cash', 'UPI', 'Card')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, invoice_no)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  quantity numeric(12,2) not null,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('sale', 'add', 'reduce', 'adjust')),
  quantity numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

drop trigger if exists restaurants_set_updated_at on public.restaurants;
create trigger restaurants_set_updated_at before update on public.restaurants
for each row execute function public.set_updated_at();

drop trigger if exists menu_categories_set_updated_at on public.menu_categories;
create trigger menu_categories_set_updated_at before update on public.menu_categories
for each row execute function public.set_updated_at();

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at before update on public.menu_items
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create index if not exists idx_restaurants_owner_id on public.restaurants(owner_id);
create index if not exists idx_menu_categories_restaurant_id on public.menu_categories(restaurant_id);
create index if not exists idx_menu_items_restaurant_id on public.menu_items(restaurant_id);
create index if not exists idx_menu_items_category_id on public.menu_items(category_id);
create index if not exists idx_orders_restaurant_id on public.orders(restaurant_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_restaurant_id on public.order_items(restaurant_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_menu_item_id on public.order_items(menu_item_id);
create index if not exists idx_inventory_movements_restaurant_id on public.inventory_movements(restaurant_id);
create index if not exists idx_inventory_movements_created_at on public.inventory_movements(created_at desc);
create index if not exists idx_inventory_movements_menu_item_id on public.inventory_movements(menu_item_id);

alter table public.restaurants enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "Owners manage their restaurants" on public.restaurants;
create policy "Owners manage their restaurants"
on public.restaurants
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Owners manage their menu categories" on public.menu_categories;
create policy "Owners manage their menu categories"
on public.menu_categories
for all
using (
  exists (
    select 1 from public.restaurants r
    where r.id = menu_categories.restaurant_id
      and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = menu_categories.restaurant_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Owners manage their menu items" on public.menu_items;
create policy "Owners manage their menu items"
on public.menu_items
for all
using (
  exists (
    select 1 from public.restaurants r
    where r.id = menu_items.restaurant_id
      and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = menu_items.restaurant_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Owners manage their orders" on public.orders;
create policy "Owners manage their orders"
on public.orders
for all
using (
  exists (
    select 1 from public.restaurants r
    where r.id = orders.restaurant_id
      and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = orders.restaurant_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Owners manage their order items" on public.order_items;
create policy "Owners manage their order items"
on public.order_items
for all
using (
  exists (
    select 1 from public.restaurants r
    where r.id = order_items.restaurant_id
      and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = order_items.restaurant_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Owners manage their inventory movements" on public.inventory_movements;
create policy "Owners manage their inventory movements"
on public.inventory_movements
for all
using (
  exists (
    select 1 from public.restaurants r
    where r.id = inventory_movements.restaurant_id
      and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = inventory_movements.restaurant_id
      and r.owner_id = auth.uid()
  )
);
