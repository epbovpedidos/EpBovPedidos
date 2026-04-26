# EP Bov Pedidos

## Overview

Cattle sales order management system (Brazilian Portuguese) for "EP Comercio de Bovinos". Issues sale orders, manages clients, dashboards, reports, and PDF/WhatsApp delivery.

## Stack

- **Monorepo**: pnpm workspaces, TypeScript 5.9, Node 24
- **Frontend**: React + Vite (`artifacts/ep-bov-pedidos`), Tailwind v4, shadcn/ui, recharts, framer-motion, react-hook-form + zod, jspdf + jspdf-autotable
- **Backend**: Express 5 (`artifacts/api-server`) on `/api`
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`)
- **API contract**: OpenAPI in `lib/api-spec/openapi.yaml`, codegen via Orval into `@workspace/api-client-react` and `@workspace/api-zod`

## Domain model

- `customers` — clientes (compradores e vendedores) with banking + roteiro info
- `orders` — pedidos with sequential `numero`, totals, status, payment terms
- `order_items` — items per pedido (espécie, raça, idade, qtd, peso, preço/arroba)

## Key endpoints

- `/api/customers` — CRUD
- `/api/orders` — CRUD + `/orders/:id/issue`
- `/api/dashboard/{summary,by-buyer,by-species,by-breed,by-age-range,recent-orders,monthly-sales}`
- `/api/reports/{top-buyers,top-sellers}`

## Pages

- `/` — login (visual-only, localStorage flag)
- `/dashboard` — KPIs + charts + recent orders
- `/pedidos`, `/pedidos/novo`, `/pedidos/:id`, `/pedidos/:id/editar`
- `/clientes`, `/clientes/novo`, `/clientes/:id/editar`
- `/relatorios`
- `/configuracoes` — logo upload + theme color in localStorage

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/Zod
- `pnpm --filter @workspace/db run push` — push DB schema
- `pnpm --filter @workspace/scripts run seed` — seed example data
