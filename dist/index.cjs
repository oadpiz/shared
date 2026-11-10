"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  buildLineDeepLink: () => buildLineDeepLink,
  buildLineOrderDeepLink: () => buildLineOrderDeepLink,
  buildProductOrderMessage: () => buildProductOrderMessage,
  getMinPaidSpecPrice: () => getMinPaidSpecPrice,
  getOptionPricedStartLabel: () => getOptionPricedStartLabel,
  resolveOrderSelectionRows: () => resolveOrderSelectionRows,
  updatePageMeta: () => updatePageMeta
});
module.exports = __toCommonJS(index_exports);

// src/priceDisplay.ts
function getMinPaidSpecPrice(product) {
  const candidates = [];
  const variantPrices = (product.variants ?? []).map((variant) => variant.price).filter((price) => Number.isFinite(price) && price > 0);
  if (variantPrices.length > 0) candidates.push(Math.min(...variantPrices));
  const modifiers = (product.options ?? []).flatMap((option) => option.type === "text" ? [] : option.values.map((value) => value.priceModifier)).filter((modifier) => Number.isFinite(modifier) && modifier > 0);
  if (modifiers.length > 0) candidates.push(Math.max(product.price, 0) + Math.min(...modifiers));
  if (candidates.length === 0) return null;
  return Math.round(Math.min(...candidates));
}
function isQuoteOnlyProduct(product, options) {
  if (options?.isQuoteOnly) return options.isQuoteOnly(product);
  const slugs = options?.quoteOnlySlugs;
  if (!slugs || slugs.length === 0) return false;
  const targets = new Set(slugs.map((slug) => slug.trim().toLowerCase()));
  return [product.id, product.sku, product.handle].some(
    (value) => typeof value === "string" && targets.has(value.trim().toLowerCase())
  );
}
function getOptionPricedStartLabel(product, effectivePrice, options) {
  if (effectivePrice > 0) return null;
  if (isQuoteOnlyProduct(product, options)) return null;
  const startPrice = getMinPaidSpecPrice(product);
  if (startPrice == null) return null;
  return `\u4F9D\u9078\u9805\u8A08\u50F9\uFF0CNT$ ${startPrice.toLocaleString()} \u8D77`;
}

// src/lineOrder.ts
function buildLineDeepLink(officialId, message) {
  const trimmedId = officialId.trim();
  if (!trimmedId) {
    throw new Error("buildLineDeepLink: officialId is required\uFF08LINE \u5B98\u65B9\u5E33\u865F ID\uFF0C\u4E0D\u542B @\uFF09");
  }
  const base = `https://line.me/R/ti/p/@${trimmedId}`;
  const trimmed = message?.trim() ?? "";
  return trimmed ? `${base}?text=${encodeURIComponent(trimmed)}` : base;
}
function resolveOrderSelectionRows(product, selectedOptions) {
  const rows = [];
  for (const option of product.options ?? []) {
    const selected = selectedOptions?.[option.id];
    if (!selected) continue;
    if (option.type === "text") {
      const text = typeof selected === "string" ? selected.trim() : "";
      if (text) rows.push({ label: option.name, value: text });
      continue;
    }
    const valueIds = Array.isArray(selected) ? selected : [selected];
    const texts = valueIds.map((valueId) => option.values.find((value) => value.id === valueId)?.value).filter((value) => !!value);
    if (texts.length > 0) rows.push({ label: option.name, value: texts.join("\u3001") });
  }
  return rows;
}
function buildProductOrderMessage(draft) {
  const hasSpec = !!draft.variantName || (draft.selectionRows?.length ?? 0) > 0;
  if (!hasSpec && !draft.priceLabel) {
    return `\u4F60\u597D\uFF0C\u6211\u60F3\u8A62\u554F\u300C${draft.productTitle}\u300D\u7684\u8A02\u8CFC\u8CC7\u8A0A\uFF0C\u8B1D\u8B1D\uFF01`;
  }
  const lines = [`\u4F60\u597D\uFF0C\u6211\u60F3\u8A02\u8CFC\u300C${draft.productTitle}\u300D`];
  if (draft.variantName) lines.push(`\u898F\u683C\uFF1A${draft.variantName}`);
  for (const row of draft.selectionRows ?? []) lines.push(`${row.label}\uFF1A${row.value}`);
  if (draft.priceLabel) lines.push(`\u50F9\u683C\uFF1A${draft.priceLabel}`);
  lines.push("\u518D\u9EBB\u7169\u8207\u6211\u78BA\u8A8D\u7D30\u7BC0\uFF0C\u8B1D\u8B1D\uFF01");
  return lines.join("\n");
}
function buildLineOrderDeepLink(officialId, draft) {
  return buildLineDeepLink(officialId, buildProductOrderMessage(draft));
}

// src/pageMeta.ts
function upsertMeta(selector, attr, key, content) {
  let meta = document.querySelector(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
}
function upsertCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}
function resolveAbsoluteUrl(origin, pathOrUrl) {
  if (pathOrUrl == null) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!origin) return "";
  return `${origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}
function updatePageMeta(meta) {
  if (typeof document === "undefined") return () => void 0;
  const pageTitle = meta.title?.trim() ?? "";
  const fullTitle = pageTitle ? meta.siteName ? `${pageTitle} | ${meta.siteName}` : pageTitle : meta.defaults?.title ?? meta.siteName ?? "";
  const origin = meta.siteUrl?.replace(/\/+$/, "") || (typeof window !== "undefined" ? window.location.origin : "");
  let path = meta.path;
  if (path == null && typeof window !== "undefined") {
    path = `${window.location.pathname}${window.location.search}`;
  }
  const canonical = resolveAbsoluteUrl(origin, path);
  const image = resolveAbsoluteUrl(origin, meta.image);
  if (fullTitle) document.title = fullTitle;
  const description = meta.description?.trim() || meta.defaults?.description || "";
  if (description) {
    upsertMeta('meta[name="description"]', "name", "description", description);
  }
  if (fullTitle) {
    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
  }
  if (description) {
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
  }
  if (canonical) {
    upsertCanonical(canonical);
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonical);
    upsertMeta('meta[name="twitter:url"]', "name", "twitter:url", canonical);
  }
  if (image) {
    upsertMeta('meta[property="og:image"]', "property", "og:image", image);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  }
  const defaults = meta.defaults;
  return () => {
    if (!defaults) return;
    if (defaults.title) document.title = defaults.title;
    if (defaults.description) {
      upsertMeta('meta[name="description"]', "name", "description", defaults.description);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildLineDeepLink,
  buildLineOrderDeepLink,
  buildProductOrderMessage,
  getMinPaidSpecPrice,
  getOptionPricedStartLabel,
  resolveOrderSelectionRows,
  updatePageMeta
});
//# sourceMappingURL=index.cjs.map