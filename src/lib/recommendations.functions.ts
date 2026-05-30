// Recommendations engine — heuristic blend of affinity + trending + new arrivals
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const Input = z.object({
  surface: z.enum(["home", "shop", "cart", "post_purchase"]).default("home"),
  userId: z.string().uuid().nullable().optional(),
  sessionId: z.string().min(1).max(200).nullable().optional(),
  limit: z.number().int().min(1).max(24).default(12),
  excludeIds: z.array(z.string().uuid()).max(50).optional(),
});

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  thumbnail: string | null;
  category_id: string | null;
  avg_rating: number | null;
  review_count: number | null;
  stock_quantity: number;
  is_featured: boolean;
  created_at: string;
};

const DEFAULT_WEIGHTS = { affinity: 0.4, trending: 0.25, recent: 0.2, featured: 0.1, fresh: 0.05 };
const DEFAULT_KIND_WEIGHTS: Record<string, number> = {
  view: 1,
  hover: 0.8,
  click: 1.5,
  wishlist: 2.5,
  cart: 3,
  purchase: 4,
  dwell: 0.5,
};

type RecoConfig = {
  enabled: boolean;
  weights: typeof DEFAULT_WEIGHTS;
  kind_weights: Record<string, number>;
  freshness_days: number;
  diversity_cap: number;
  ai_rerank_enabled: boolean;
  ai_rerank_top_k: number;
  ai_rerank_model: string;
};

const DEFAULT_CONFIG: RecoConfig = {
  enabled: true,
  weights: DEFAULT_WEIGHTS,
  kind_weights: DEFAULT_KIND_WEIGHTS,
  freshness_days: 7,
  diversity_cap: 3,
  ai_rerank_enabled: false,
  ai_rerank_top_k: 24,
  ai_rerank_model: "google/gemini-2.5-flash",
};

async function loadConfig(): Promise<RecoConfig> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "recommendations_config")
      .maybeSingle();
    const v = (data?.value as Partial<RecoConfig>) || {};
    return {
      ...DEFAULT_CONFIG,
      ...v,
      weights: { ...DEFAULT_WEIGHTS, ...(v.weights || {}) },
      kind_weights: { ...DEFAULT_KIND_WEIGHTS, ...(v.kind_weights || {}) },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function aiRerank(
  products: Product[],
  signals: { topCategories: string[]; surface: string; model: string },
): Promise<Product[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || products.length < 2) return products;
  try {
    const payload = products.slice(0, 24).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      featured: p.is_featured,
      rating: p.avg_rating ?? 0,
      reviews: p.review_count ?? 0,
    }));
    const sys = `You are a product merchandiser. Rerank the given products to maximize relevance for a shopper on the "${signals.surface}" surface whose top interest categories are: ${signals.topCategories.join(", ") || "unknown"}. Favor variety, social proof, and items that complement the user's interests. Return ONLY a JSON object: {"order": ["productId", ...]} with all input ids reordered.`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: signals.model,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: JSON.stringify(payload) },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return products;
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
    const order: string[] = Array.isArray(parsed?.order) ? parsed.order : [];
    if (!order.length) return products;
    const byId = new Map(products.map((p) => [p.id, p]));
    const reranked: Product[] = [];
    for (const id of order) {
      const p = byId.get(id);
      if (p) {
        reranked.push(p);
        byId.delete(id);
      }
    }
    return [...reranked, ...byId.values()];
  } catch {
    return products;
  }
}

export const getRecommendations = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const config = await loadConfig();
    if (!config.enabled) return { products: [] as Product[], rerankedByAI: false };
    const WEIGHTS = config.weights;
    const limit = data.limit;
    const exclude = new Set(data.excludeIds ?? []);

    // 1. Affinity: category scores from this user's/session's interactions (last 60d, recency-decayed)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    let affinityRows: any[] = [];
    if (data.userId || data.sessionId) {
      const q = supabaseAdmin
        .from("product_interactions")
        .select("product_id, kind, created_at")
        .gte("created_at", sixtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(200);
      const { data: rows } = data.userId
        ? await q.eq("user_id", data.userId)
        : await q.eq("session_id", data.sessionId!);
      affinityRows = rows ?? [];
    }

    const KIND_WEIGHT = config.kind_weights;
    const productAffinity = new Map<string, number>();
    const now = Date.now();
    for (const r of affinityRows) {
      const ageDays = Math.max(0, (now - new Date(r.created_at).getTime()) / 86_400_000);
      const decay = Math.exp(-ageDays / 14);
      const w = (KIND_WEIGHT[r.kind] ?? 1) * decay;
      productAffinity.set(r.product_id, (productAffinity.get(r.product_id) ?? 0) + w);
    }

    const affinityProductIds = [...productAffinity.keys()];
    const categoryAffinity = new Map<string, number>();
    if (affinityProductIds.length) {
      const { data: catRows } = await supabaseAdmin
        .from("products")
        .select("id, category_id")
        .in("id", affinityProductIds);
      for (const p of catRows ?? []) {
        if (!p.category_id) continue;
        categoryAffinity.set(
          p.category_id,
          (categoryAffinity.get(p.category_id) ?? 0) + (productAffinity.get(p.id) ?? 0),
        );
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: trendingRows } = await supabaseAdmin
      .from("product_interactions")
      .select("product_id, kind")
      .gte("created_at", sevenDaysAgo)
      .limit(2000);
    const trendingScore = new Map<string, number>();
    for (const r of trendingRows ?? []) {
      trendingScore.set(r.product_id, (trendingScore.get(r.product_id) ?? 0) + (KIND_WEIGHT[r.kind] ?? 1));
    }

    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, price, compare_at_price, thumbnail, category_id, avg_rating, review_count, stock_quantity, is_featured, created_at")
      .eq("is_active", true)
      .gt("stock_quantity", 0)
      .order("created_at", { ascending: false })
      .limit(120);

    const candidates = (products ?? []) as Product[];
    if (!candidates.length) return { products: [] as Product[], rerankedByAI: false };

    const maxAffinity = Math.max(1, ...productAffinity.values(), ...categoryAffinity.values());
    const maxTrending = Math.max(1, ...trendingScore.values());
    const oldestMs = Math.min(...candidates.map((p) => new Date(p.created_at).getTime()));
    const newestMs = Math.max(...candidates.map((p) => new Date(p.created_at).getTime()));
    const freshRange = Math.max(1, newestMs - oldestMs);

    const scored = candidates
      .filter((p) => !exclude.has(p.id))
      .map((p) => {
        const affP = (productAffinity.get(p.id) ?? 0) / maxAffinity;
        const affC = p.category_id ? (categoryAffinity.get(p.category_id) ?? 0) / maxAffinity : 0;
        const affinity = Math.max(affP * 0.6, affC * 0.4);
        const trending = (trendingScore.get(p.id) ?? 0) / maxTrending;
        const recentBoost = p.is_featured ? 1 : 0;
        const featured = p.is_featured ? 1 : 0;
        const freshness = (new Date(p.created_at).getTime() - oldestMs) / freshRange;
        const score =
          affinity * WEIGHTS.affinity +
          trending * WEIGHTS.trending +
          recentBoost * WEIGHTS.recent +
          featured * WEIGHTS.featured +
          freshness * WEIGHTS.fresh +
          Math.random() * 0.02;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score);

    // Diversity cap per category
    const cap = Math.max(1, config.diversity_cap);
    const perCat = new Map<string, number>();
    const diversified: Product[] = [];
    for (const { p } of scored) {
      const k = p.category_id ?? "_";
      const c = perCat.get(k) ?? 0;
      if (c >= cap) continue;
      perCat.set(k, c + 1);
      diversified.push(p);
      if (diversified.length >= Math.max(limit, config.ai_rerank_top_k)) break;
    }

    // Optional AI rerank pass on top-K, then trim to limit
    let rerankedByAI = false;
    let final = diversified;
    if (config.ai_rerank_enabled) {
      const topCategories = [...categoryAffinity.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);
      const head = diversified.slice(0, config.ai_rerank_top_k);
      const tail = diversified.slice(config.ai_rerank_top_k);
      const reranked = await aiRerank(head, {
        topCategories,
        surface: data.surface,
        model: config.ai_rerank_model,
      });
      rerankedByAI = reranked !== head;
      final = [...reranked, ...tail];
    }

    return { products: final.slice(0, limit), rerankedByAI };
  });

