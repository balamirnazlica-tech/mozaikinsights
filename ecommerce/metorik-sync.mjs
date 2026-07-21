#!/usr/bin/env node
/**
 * Metorik -> Mission Control sync
 * ---------------------------------------------------------------
 * Pulls order, customer, product and subscription data from the
 * Metorik API (https://metorik.dev) and writes a single JSON
 * snapshot (ecommerce-data.json) that the static dashboard
 * (ecommerce-dashboard.html) fetches at runtime.
 *
 * Usage:
 *   METORIK_API_KEY=xxxxx node metorik-sync.mjs
 *   node metorik-sync.mjs --mock          (writes fixture data, no API calls)
 *
 * Env vars:
 *   METORIK_API_KEY   required (Reports & Data scope)
 *   MONTHS_BACK        optional, default 12
 *   OUT_FILE           optional, default ./ecommerce-data.json
 * ---------------------------------------------------------------
 */

const API_BASE = "https://app.metorik.com/api/v1/store";
const API_KEY = process.env.METORIK_API_KEY;
const MONTHS_BACK = parseInt(process.env.MONTHS_BACK || "12", 10);
const OUT_FILE = process.env.OUT_FILE || "./ecommerce-data.json";
const MOCK = process.argv.includes("--mock");

function pad(n) { return String(n).padStart(2, "0"); }

// Returns [{label:"2026-01", start:"2026-01-01", end:"2026-01-31"}, ...] for the
// last N months, oldest first, including the current (partial) month.
function lastMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const end = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(lastDay)}`;
    out.push({ label: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, start, end });
  }
  return out;
}

async function metorikGet(path, params = {}, retries = 4) {
  if (MOCK) throw new Error("metorikGet called in mock mode — should not happen");
  const url = new URL(API_BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
    });
    if (res.status === 429 && attempt < retries) {
      // Rate limited — back off and retry.
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Metorik API ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 300)}`);
    }
    return res.json();
  }
  throw new Error(`Metorik API ${path}: exhausted retries after repeated 429s`);
}

// Statuses that count as a real sale. Matches Metorik's own dashboard, which
// excludes pending, cancelled and failed orders — without this filter the
// totals overstate revenue (e.g. Jan 2026: ₺2.36M vs the correct ₺1.87M
// gross, 108 vs 86 orders). NOTE: "refunded" IS included, exactly like
// Metorik: refunded orders stay in gross sales and their refund amounts are
// subtracted via total_refunds/net instead (verified against Metorik's
// dashboard for Jan 2026 to the lira).
const SALE_STATUSES = ["completed", "processing", "on-hold", "refunded"];

// Order totals for a date window, using the order_created_at "between" filter.
async function orderTotalsForRange(start, end) {
  const filters = JSON.stringify([
    { field: "order_created_at", operator: "between", value: [start, end] },
    { field: "status", operator: "in", value: SALE_STATUSES },
  ]);
  const json = await metorikGet("/orders/totals", { filters });
  return json.data;
}

// Orders that never became a sale: failed payments, cancellations and
// checkouts stuck in pending (e.g. abandoned bank transfers). This is
// checkout leakage — partly recoverable revenue — surfaced on the dashboard
// as "Lost orders".
const LOST_STATUSES = ["pending", "cancelled", "failed"];

async function lostOrderTotalsForRange(start, end) {
  const filters = JSON.stringify([
    { field: "order_created_at", operator: "between", value: [start, end] },
    { field: "status", operator: "in", value: LOST_STATUSES },
  ]);
  const json = await metorikGet("/orders/totals", { filters });
  return json.data;
}

async function customerTotalsForRange(start, end) {
  const json = await metorikGet("/customers/totals", {
    order_start_date: start,
    order_end_date: end,
  });
  return json.data;
}

// True new-customer count for a window: customers whose first-ever order
// falls inside [start, end]. The order_start_date/order_end_date variant of
// /customers/totals is NOT period-scoped for `count`, so it can't be used
// for this — a separate filtered call is required.
async function newCustomersInRange(start, end) {
  const filters = JSON.stringify([
    { field: "first_order_date", operator: "between", value: [start, end] },
  ]);
  const json = await metorikGet("/customers/totals", { filters });
  return json.data?.count ?? null;
}

async function topProducts(start, end, per_page = 10) {
  const json = await metorikGet("/products", {
    start_date: start,
    end_date: end,
    per_page,
    order_by: "net_sales",
    order_dir: "desc",
  });
  return json.data;
}

async function subscriptionTotals() {
  try {
    const json = await metorikGet("/subscriptions/totals");
    return json.data;
  } catch (e) {
    // Store may not have WooCommerce Subscriptions / Metorik Recurring enabled.
    console.warn("Subscriptions totals unavailable:", e.message);
    return null;
  }
}

function mockData() {
  const months = lastMonths(MONTHS_BACK).map((m) => {
    const revenue = Math.round(180000 + Math.random() * 90000);
    const orders = Math.round(40 + Math.random() * 25);
    const returning = Math.round(15 + Math.random() * 20);
    const newCust = Math.round(10 + Math.random() * 15);
    return {
      month: m.label,
      revenue,
      net: Math.round(revenue * 0.94),
      orders,
      average_order_value: Math.round(revenue / orders),
      unique_customers: newCust + returning,
      total_refunds: Math.round(revenue * 0.02),
      new_customers: newCust,
      returning_customers: returning,
      returning_customers_rate: Math.round((returning / (newCust + returning)) * 1000) / 10,
      lost_revenue: Math.round(revenue * 0.2),
      lost_orders: Math.round(orders * 0.2),
    };
  });
  return {
    meta: {
      company: "Mozaik Design",
      scope: "E-commerce (Metorik)",
      currency: "TRY",
      generated: new Date().toISOString().slice(0, 10),
      source: "MOCK DATA — run without --mock and a real METORIK_API_KEY for live numbers",
    },
    months,
    products: [
      { name: "Sample Product A", sku: "MTK-A", net_sales: 45230, net_orders: 12, gross_items_sold: 18, in_stock: true, stock_quantity: 6 },
      { name: "Sample Product B", sku: "MTK-B", net_sales: 31200, net_orders: 8, gross_items_sold: 10, in_stock: true, stock_quantity: 22 },
      { name: "Sample Product C", sku: "MTK-C", net_sales: 18400, net_orders: 5, gross_items_sold: 5, in_stock: false, stock_quantity: 0 },
    ],
    subscriptions: { count: 14, total_items: 21, total_mrr: 6200, total_arr: 74400, average_subscription_items: 1.5 },
  };
}

async function main() {
  if (MOCK) {
    const data = mockData();
    await writeOut(data);
    return;
  }

  if (!API_KEY) {
    console.error("Missing METORIK_API_KEY env var. Set it, or run with --mock to generate sample data.");
    process.exit(1);
  }

  const months = lastMonths(MONTHS_BACK);
  const monthly = [];

  for (const m of months) {
    const [orderTotals, customerTotals, newCustomers, lostTotals] = await Promise.all([
      orderTotalsForRange(m.start, m.end),
      customerTotalsForRange(m.start, m.end),
      newCustomersInRange(m.start, m.end),
      lostOrderTotalsForRange(m.start, m.end),
    ]);
    const returning = customerTotals?.returning_customers ?? null;
    monthly.push({
      month: m.label,
      revenue: orderTotals?.total ?? 0,
      net: orderTotals?.net ?? 0,
      orders: orderTotals?.count ?? 0,
      average_order_value: orderTotals?.average_order_value ?? 0,
      unique_customers: orderTotals?.unique_customers ?? 0,
      total_refunds: orderTotals?.total_refunds ?? 0,
      new_customers: newCustomers,
      returning_customers: returning,
      returning_customers_rate: customerTotals?.returning_customers_rate ?? null,
      lost_revenue: lostTotals?.total ?? 0,
      lost_orders: lostTotals?.count ?? 0,
    });
    // Small delay between months to stay comfortably under Metorik's rate limit.
    await new Promise((r) => setTimeout(r, 400));
  }

  const last90Start = months[Math.max(0, months.length - 3)].start;
  const last90End = months[months.length - 1].end;

  const [products, subscriptions] = await Promise.all([
    topProducts(last90Start, last90End, 10).catch((e) => {
      console.warn("Products fetch failed:", e.message);
      return [];
    }),
    subscriptionTotals(),
  ]);

  const data = {
    meta: {
      company: "Mozaik Design",
      scope: "E-commerce (Metorik)",
      currency: "TRY",
      generated: new Date().toISOString().slice(0, 10),
      source: "Live via Metorik API",
    },
    months: monthly,
    products: (products || []).map((p) => ({
      name: p.title,
      sku: p.sku,
      net_sales: p.net_sales ?? 0,
      net_orders: p.net_orders ?? 0,
      gross_items_sold: p.gross_items_sold ?? 0,
      in_stock: p.in_stock ?? null,
      stock_quantity: p.stock_quantity ?? null,
    })),
    subscriptions,
  };

  await writeOut(data);
}

async function writeOut(data) {
  const fs = await import("node:fs/promises");
  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2));
  console.log(`Wrote ${OUT_FILE} (${MOCK ? "mock" : "live"} data, ${data.months.length} months).`);
}

main().catch((err) => {
  console.error("Sync failed:", err.message);
  process.exit(1);
});
