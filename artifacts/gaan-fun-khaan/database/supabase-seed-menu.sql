-- Gaan Fun Khaan default menu seed
-- Run this after:
-- 1. supabase-schema.sql has succeeded
-- 2. You have signed in / created the restaurant row from the app Settings screen
--
-- This seeds categories and menu items for the currently authenticated Supabase user.

with my_restaurant as (
  select id
  from public.restaurants
  where owner_id = auth.uid()
  limit 1
),
category_seed(name, sort_order) as (
  values
    ('Tea', 1),
    ('Coffee', 2),
    ('Snacks', 3),
    ('Other', 4)
)
insert into public.menu_categories (restaurant_id, name, sort_order)
select my_restaurant.id, category_seed.name, category_seed.sort_order
from my_restaurant
cross join category_seed
on conflict (restaurant_id, name) do update
set sort_order = excluded.sort_order;

with my_restaurant as (
  select id
  from public.restaurants
  where owner_id = auth.uid()
  limit 1
),
item_seed(name, price, category_name, min_stock_qty, track_stock) as (
  values
    ('Milk Tea', 10, 'Tea', 10, true),
    ('Milk Tea Assam', 20, 'Tea', 10, true),
    ('Darjeeling Tea Makaibari', 20, 'Tea', 10, true),
    ('Black Tea', 10, 'Tea', 10, true),
    ('Chocolate Tea', 35, 'Tea', 10, true),
    ('Cream Tea', 25, 'Tea', 10, true),
    ('Banarasi Tea', 30, 'Tea', 10, true),
    ('Malai Tea', 25, 'Tea', 10, true),
    ('Ice Tea', 40, 'Tea', 10, true),
    ('Special Malai Kesar Kashmiri Tea', 181, 'Tea', 5, true),
    ('Black Coffee', 10, 'Coffee', 10, true),
    ('Milk Coffee', 20, 'Coffee', 10, true),
    ('Chocolate Coffee', 40, 'Coffee', 10, true),
    ('Hot Chocolate', 99, 'Coffee', 5, true),
    ('French Fries Small', 33, 'Snacks', 10, true),
    ('French Fries Large', 55, 'Snacks', 10, true),
    ('Nuggets 8 pcs', 59, 'Snacks', 10, true),
    ('Fish Finger 6 pcs', 120, 'Snacks', 5, true),
    ('Cheese Ball 6 pcs', 79, 'Snacks', 8, true),
    ('Chicken Wings 4 pcs', 99, 'Snacks', 8, true),
    ('Chicken Lollipop 2 pcs', 55, 'Snacks', 8, true),
    ('Chicken Lollipop 4 pcs', 99, 'Snacks', 8, true),
    ('Chicken Strips 5 pcs', 99, 'Snacks', 8, true),
    ('Chicken Pop', 99, 'Snacks', 8, true),
    ('Chicken Garlic Finger', 118, 'Snacks', 8, true),
    ('Chicken Peri Peri Finger', 69, 'Snacks', 8, true),
    ('Kurseong Chicken Momo with Soup', 60, 'Snacks', 10, true),
    ('Maggi Veg', 20, 'Snacks', 10, true),
    ('Egg Maggi', 40, 'Snacks', 10, true),
    ('Fried Maggi', 50, 'Snacks', 10, true),
    ('All Mokal', 33, 'Snacks', 10, true),
    ('Lassi', 33, 'Snacks', 10, true),
    ('Breakfast Package', 59, 'Snacks', 10, true),
    ('Sandwich Veg', 69, 'Snacks', 8, true),
    ('Sandwich Chicken', 89, 'Snacks', 8, true),
    ('Customise Cake', null, 'Other', 0, false)
)
insert into public.menu_items (
  restaurant_id,
  category_id,
  name,
  price,
  stock_qty,
  min_stock_qty,
  track_stock,
  is_available
)
select
  my_restaurant.id,
  menu_categories.id,
  item_seed.name,
  item_seed.price,
  100,
  item_seed.min_stock_qty,
  item_seed.track_stock,
  true
from my_restaurant
join item_seed on true
join public.menu_categories
  on menu_categories.restaurant_id = my_restaurant.id
 and menu_categories.name = item_seed.category_name
where not exists (
  select 1
  from public.menu_items existing
  where existing.restaurant_id = my_restaurant.id
    and existing.name = item_seed.name
);
