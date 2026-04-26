import { db, ordersTable, orderItemsTable, customersTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";

export async function getNextOrderNumber(): Promise<string> {
  const result = await db
    .select({ count: sql<string>`count(*)` })
    .from(ordersTable);
  const count = Number(result[0]?.count ?? 0) + 1;
  return String(count).padStart(4, "0");
}

export function calcItemTotal(peso: number, precoArroba: number): number {
  return Math.round(peso * precoArroba * 100) / 100;
}

export function summarizeItems(
  items: Array<{ quantidade: number; peso: number; precoArroba: number }>,
): { totalAnimais: number; totalPeso: number; totalValor: number } {
  let totalAnimais = 0;
  let totalPeso = 0;
  let totalValor = 0;
  for (const it of items) {
    totalAnimais += Number(it.quantidade);
    totalPeso += Number(it.peso);
    totalValor += calcItemTotal(Number(it.peso), Number(it.precoArroba));
  }
  return {
    totalAnimais,
    totalPeso: Math.round(totalPeso * 100) / 100,
    totalValor: Math.round(totalValor * 100) / 100,
  };
}

export async function loadFullOrder(id: number) {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, id))
    .orderBy(orderItemsTable.id);

  const [comprador] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, order.compradorId));
  const [vendedor] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, order.vendedorId));

  return {
    id: order.id,
    numero: order.numero,
    dataEmissao: order.dataEmissao,
    compradorId: order.compradorId,
    vendedorId: order.vendedorId,
    comprador: comprador
      ? { ...comprador, createdAt: comprador.createdAt }
      : undefined,
    vendedor: vendedor
      ? { ...vendedor, createdAt: vendedor.createdAt }
      : undefined,
    dataEmbarque: order.dataEmbarque,
    dataDesembarque: order.dataDesembarque,
    dataAbate: order.dataAbate,
    roteiro: order.roteiro,
    formaPagamento: order.formaPagamento,
    prazoPagamento: order.prazoPagamento,
    observacao: order.observacao,
    dataCompra: order.dataCompra,
    assinaturaComprador: order.assinaturaComprador,
    assinaturaVendedor: order.assinaturaVendedor,
    status: order.status,
    totalAnimais: order.totalAnimais,
    totalPeso: Number(order.totalPeso),
    totalValor: Number(order.totalValor),
    items: items.map((i) => ({
      id: i.id,
      especie: i.especie,
      raca: i.raca,
      idade: i.idade,
      quantidade: i.quantidade,
      peso: Number(i.peso),
      precoArroba: Number(i.precoArroba),
      total: Number(i.total),
      rastreabilidade: i.rastreabilidade,
    })),
  };
}

export async function listOrderSummaries(filters: {
  status?: string;
  customerId?: number;
  from?: string;
  to?: string;
}) {
  const { pool } = await import("@workspace/db");
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`o.status = $${params.length}`);
  }
  if (filters.customerId) {
    params.push(filters.customerId);
    conditions.push(
      `(o.comprador_id = $${params.length} OR o.vendedor_id = $${params.length})`,
    );
  }
  if (filters.from) {
    params.push(filters.from);
    conditions.push(`o.data_emissao >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    conditions.push(`o.data_emissao <= $${params.length}`);
  }
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const queryText =
    `SELECT o.id, o.numero, o.data_emissao as "dataEmissao", ` +
    `buyer.nome as "compradorNome", ` +
    `seller.nome as "vendedorNome", ` +
    `buyer.municipio as "municipio", ` +
    `o.total_animais as "totalAnimais", ` +
    `o.total_valor as "totalValor", ` +
    `o.status ` +
    `FROM orders o ` +
    `JOIN customers buyer ON buyer.id = o.comprador_id ` +
    `JOIN customers seller ON seller.id = o.vendedor_id ` +
    `${whereClause} ` +
    `ORDER BY o.data_emissao DESC`;

  const { rows } = await pool.query(queryText, params);
  return rows.map((r: Record<string, unknown>) => ({
    id: Number(r.id),
    numero: String(r.numero),
    dataEmissao: r.dataEmissao as Date,
    compradorNome: String(r.compradorNome),
    vendedorNome: String(r.vendedorNome),
    municipio: r.municipio == null ? null : String(r.municipio),
    totalAnimais: Number(r.totalAnimais),
    totalValor: Number(r.totalValor),
    status: String(r.status),
  }));
}

export async function getRecentOrderSummaries(limit = 5) {
  const all = await listOrderSummaries({});
  return all.slice(0, limit);
}

export async function getDashboardSummary() {
  const totals = await db
    .select({
      totalPedidos: sql<string>`count(*)`,
      totalAnimais: sql<string>`coalesce(sum(${ordersTable.totalAnimais}), 0)`,
      totalValor: sql<string>`coalesce(sum(${ordersTable.totalValor}), 0)`,
    })
    .from(ordersTable);
  const counts = await db
    .select({ count: sql<string>`count(*)` })
    .from(customersTable);
  const monthRows = await db
    .select({
      pedidos: sql<string>`count(*)`,
      valor: sql<string>`coalesce(sum(${ordersTable.totalValor}), 0)`,
    })
    .from(ordersTable)
    .where(sql`date_trunc('month', ${ordersTable.dataEmissao}) = date_trunc('month', now())`);

  return {
    totalPedidos: Number(totals[0]?.totalPedidos ?? 0),
    totalAnimais: Number(totals[0]?.totalAnimais ?? 0),
    totalValor: Number(totals[0]?.totalValor ?? 0),
    totalCompradores: Number(counts[0]?.count ?? 0),
    totalVendedores: Number(counts[0]?.count ?? 0),
    pedidosMes: Number(monthRows[0]?.pedidos ?? 0),
    valorMes: Number(monthRows[0]?.valor ?? 0),
  };
}

export async function groupBy(field: "buyer" | "especie" | "raca" | "idade") {
  if (field === "buyer") {
    const result = await db
      .select({
        label: customersTable.nome,
        animais: sql<string>`coalesce(sum(${ordersTable.totalAnimais}), 0)`,
        valor: sql<string>`coalesce(sum(${ordersTable.totalValor}), 0)`,
      })
      .from(ordersTable)
      .innerJoin(customersTable, eq(customersTable.id, ordersTable.compradorId))
      .groupBy(customersTable.nome)
      .orderBy(desc(sql`sum(${ordersTable.totalValor})`));
    return result.map((r) => ({
      label: r.label,
      animais: Number(r.animais),
      valor: Number(r.valor),
    }));
  }

  const col =
    field === "especie"
      ? orderItemsTable.especie
      : field === "raca"
        ? orderItemsTable.raca
        : orderItemsTable.idade;

  const result = await db
    .select({
      label: col,
      animais: sql<string>`coalesce(sum(${orderItemsTable.quantidade}), 0)`,
      valor: sql<string>`coalesce(sum(${orderItemsTable.total}), 0)`,
    })
    .from(orderItemsTable)
    .groupBy(col)
    .orderBy(desc(sql`sum(${orderItemsTable.total})`));

  return result.map((r) => ({
    label: r.label,
    animais: Number(r.animais),
    valor: Number(r.valor),
  }));
}

export async function getMonthlySales() {
  const result = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${ordersTable.dataEmissao}), 'YYYY-MM')`,
      pedidos: sql<string>`count(*)`,
      animais: sql<string>`coalesce(sum(${ordersTable.totalAnimais}), 0)`,
      valor: sql<string>`coalesce(sum(${ordersTable.totalValor}), 0)`,
    })
    .from(ordersTable)
    .groupBy(sql`date_trunc('month', ${ordersTable.dataEmissao})`)
    .orderBy(sql`date_trunc('month', ${ordersTable.dataEmissao})`);
  return result.map((r) => ({
    month: r.month,
    pedidos: Number(r.pedidos),
    animais: Number(r.animais),
    valor: Number(r.valor),
  }));
}

export async function getTopRanking(side: "comprador" | "vendedor") {
  const fk = side === "comprador" ? ordersTable.compradorId : ordersTable.vendedorId;
  const result = await db
    .select({
      nome: customersTable.nome,
      pedidos: sql<string>`count(*)`,
      animais: sql<string>`coalesce(sum(${ordersTable.totalAnimais}), 0)`,
      valor: sql<string>`coalesce(sum(${ordersTable.totalValor}), 0)`,
    })
    .from(ordersTable)
    .innerJoin(customersTable, eq(customersTable.id, fk))
    .groupBy(customersTable.nome)
    .orderBy(desc(sql`sum(${ordersTable.totalValor})`))
    .limit(10);
  return result.map((r) => ({
    nome: r.nome,
    pedidos: Number(r.pedidos),
    animais: Number(r.animais),
    valor: Number(r.valor),
  }));
}
