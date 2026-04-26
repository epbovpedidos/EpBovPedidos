import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  fazenda: text("fazenda"),
  cpfCnpj: text("cpf_cnpj"),
  inscricao: text("inscricao"),
  endereco: text("endereco"),
  uf: text("uf"),
  municipio: text("municipio"),
  telefone: text("telefone"),
  email: text("email"),
  roteiro: text("roteiro"),
  banco: text("banco"),
  conta: text("conta"),
  agencia: text("agencia"),
  titular: text("titular"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Customer = typeof customersTable.$inferSelect;
export type InsertCustomer = typeof customersTable.$inferInsert;
