import { Router, type IRouter } from "express";
import {
  getDashboardSummary,
  groupBy,
  getMonthlySales,
  getRecentOrderSummaries,
  getTopRanking,
} from "../lib/orderHelpers";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  res.json(await getDashboardSummary());
});

router.get("/dashboard/by-buyer", async (_req, res): Promise<void> => {
  res.json(await groupBy("buyer"));
});

router.get("/dashboard/by-species", async (_req, res): Promise<void> => {
  res.json(await groupBy("especie"));
});

router.get("/dashboard/by-breed", async (_req, res): Promise<void> => {
  res.json(await groupBy("raca"));
});

router.get("/dashboard/by-age-range", async (_req, res): Promise<void> => {
  res.json(await groupBy("idade"));
});

router.get("/dashboard/recent-orders", async (_req, res): Promise<void> => {
  res.json(await getRecentOrderSummaries(8));
});

router.get("/dashboard/monthly-sales", async (_req, res): Promise<void> => {
  res.json(await getMonthlySales());
});

router.get("/reports/top-buyers", async (_req, res): Promise<void> => {
  res.json(await getTopRanking("comprador"));
});

router.get("/reports/top-sellers", async (_req, res): Promise<void> => {
  res.json(await getTopRanking("vendedor"));
});

export default router;
