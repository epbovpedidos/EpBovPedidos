import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, orderItemsTable } from "@workspace/db";
import {
  CreateOrderBody,
  UpdateOrderBody,
  GetOrderParams,
  UpdateOrderParams,
  DeleteOrderParams,
  IssueOrderParams,
  ListOrdersQueryParams,
} from "@workspace/api-zod";
import {
  getNextOrderNumber,
  calcItemTotal,
  summarizeItems,
  loadFullOrder,
  listOrderSummaries,
} from "../lib/orderHelpers";

const router: IRouter = Router();

router.get("/orders", async (req, res): Promise<void> => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const summaries = await listOrderSummaries({
    status: parsed.data.status,
    customerId: parsed.data.customerId,
    from: parsed.data.from,
    to: parsed.data.to,
  });
  res.json(summaries);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const numero = await getNextOrderNumber();
  const totals = summarizeItems(data.items);

  const [order] = await db
    .insert(ordersTable)
    .values({
      numero,
      compradorId: data.compradorId,
      vendedorId: data.vendedorId,
      dataEmbarque: data.dataEmbarque ?? null,
      dataDesembarque: data.dataDesembarque ?? null,
      dataAbate: data.dataAbate ?? null,
      roteiro: data.roteiro ?? null,
      formaPagamento: data.formaPagamento,
      prazoPagamento: data.prazoPagamento ?? null,
      observacao: data.observacao ?? null,
      dataCompra: data.dataCompra ?? null,
      assinaturaComprador: data.assinaturaComprador ?? null,
      assinaturaVendedor: data.assinaturaVendedor ?? null,
      status: data.status ?? "emitido",
      totalAnimais: totals.totalAnimais,
      totalPeso: String(totals.totalPeso),
      totalValor: String(totals.totalValor),
    })
    .returning();

  if (data.items.length > 0) {
    await db.insert(orderItemsTable).values(
      data.items.map((it) => ({
        orderId: order.id,
        especie: it.especie,
        raca: it.raca,
        idade: it.idade,
        quantidade: it.quantidade,
        peso: String(it.peso),
        precoArroba: String(it.precoArroba),
        total: String(calcItemTotal(it.peso, it.precoArroba)),
        rastreabilidade: it.rastreabilidade,
      })),
    );
  }

  const full = await loadFullOrder(order.id);
  res.status(201).json(full);
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const full = await loadFullOrder(params.data.id);
  if (!full) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(full);
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const totals = summarizeItems(data.items);

  await db
    .update(ordersTable)
    .set({
      compradorId: data.compradorId,
      vendedorId: data.vendedorId,
      dataEmbarque: data.dataEmbarque ?? null,
      dataDesembarque: data.dataDesembarque ?? null,
      dataAbate: data.dataAbate ?? null,
      roteiro: data.roteiro ?? null,
      formaPagamento: data.formaPagamento,
      prazoPagamento: data.prazoPagamento ?? null,
      observacao: data.observacao ?? null,
      dataCompra: data.dataCompra ?? null,
      assinaturaComprador: data.assinaturaComprador ?? null,
      assinaturaVendedor: data.assinaturaVendedor ?? null,
      status: data.status ?? "emitido",
      totalAnimais: totals.totalAnimais,
      totalPeso: String(totals.totalPeso),
      totalValor: String(totals.totalValor),
    })
    .where(eq(ordersTable.id, params.data.id));

  await db
    .delete(orderItemsTable)
    .where(eq(orderItemsTable.orderId, params.data.id));

  if (data.items.length > 0) {
    await db.insert(orderItemsTable).values(
      data.items.map((it) => ({
        orderId: params.data.id,
        especie: it.especie,
        raca: it.raca,
        idade: it.idade,
        quantidade: it.quantidade,
        peso: String(it.peso),
        precoArroba: String(it.precoArroba),
        total: String(calcItemTotal(it.peso, it.precoArroba)),
        rastreabilidade: it.rastreabilidade,
      })),
    );
  }

  const full = await loadFullOrder(params.data.id);
  if (!full) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(full);
});

router.delete("/orders/:id", async (req, res): Promise<void> => {
  const params = DeleteOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(ordersTable)
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/orders/:id/issue", async (req, res): Promise<void> => {
  const params = IssueOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .update(ordersTable)
    .set({ status: "emitido" })
    .where(eq(ordersTable.id, params.data.id));
  const full = await loadFullOrder(params.data.id);
  if (!full) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(full);
});

export default router;
