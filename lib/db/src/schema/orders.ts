import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  numero: text("numero").notNull().unique(),
  dataEmissao: timestamp("data_emissao", { withTimezone: true }).notNull().defaultNow(),
  compradorId: integer("comprador_id")
    .notNull()
    .references(() => customersTable.id),
  vendedorId: integer("vendedor_id")
    .notNull()
    .references(() => customersTable.id),
  dataEmbarque: text("data_embarque"),
  dataDesembarque: text("data_desembarque"),
  dataAbate: text("data_abate"),
  roteiro: text("roteiro"),
  formaPagamento: text("forma_pagamento").notNull(),
  prazoPagamento: text("prazo_pagamento"),
  observacao: text("observacao"),
  dataCompra: text("data_compra"),
  status: text("status").notNull().default("emitido"),
  totalAnimais: integer("total_animais").notNull().default(0),
  totalPeso: numeric("total_peso", { precision: 14, scale: 2 }).notNull().default("0"),
  totalValor: numeric("total_valor", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  especie: text("especie").notNull(),
  raca: text("raca").notNull(),
  idade: text("idade").notNull(),
  quantidade: integer("quantidade").notNull(),
  peso: numeric("peso", { precision: 14, scale: 2 }).notNull(),
  precoArroba: numeric("preco_arroba", { precision: 14, scale: 2 }).notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  rastreabilidade: boolean("rastreabilidade").notNull().default(false),
});

export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type InsertOrderItem = typeof orderItemsTable.$inferInsert;
