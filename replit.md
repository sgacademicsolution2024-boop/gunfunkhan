# Gaan Fun Khaan POS

A mobile-first restaurant billing/POS web application for Gaan Fun Khaan, a fun musical-themed restaurant. Staff can use it from any mobile device to take orders, generate bills, and track daily sales.

## Run & Operate

- `pnpm --filter @workspace/gaan-fun-khaan run dev` — run the frontend (Vite dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS
- Routing: wouter
- Persistence: localStorage (no backend)
- Build: Vite (static)

## Where things live

- `artifacts/gaan-fun-khaan/src/` — main frontend app
- `artifacts/gaan-fun-khaan/src/App.tsx` — root router
- `artifacts/gaan-fun-khaan/src/index.css` — theme/CSS variables

## Architecture decisions

- No backend: all data stored in localStorage (bills, daily sales, menu)
- Mobile-first layout: category tabs, large item buttons, sticky cart at bottom
- Desktop layout: split view (menu left, cart right)
- Print bill: uses window.print() with a thermal-style print-only CSS block
- No authentication, no inventory management

## Product

Gaan Fun Khaan POS lets restaurant staff:
- Browse menu items by category (Tea, Coffee, Snacks)
- Tap to add items to a cart
- Adjust quantities, apply discounts and GST
- Generate and print thermal-style bills
- View bill history with date/time, payment mode, totals
- View daily sales summary (total, cash, UPI, card breakdown)

## User preferences

- Warm color palette: red, yellow, cream, dark brown/black inspired by menu cards
- Fun musical theme with icons
- Clean, modern, extremely easy to use
- Large touch-friendly buttons
- Do not use emojis

## Gotchas

- All CSS custom properties must be set (not `red` placeholders) or the page renders broken
- Google Fonts @import must be the FIRST line in index.css
