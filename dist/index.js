import {
  updatePageMeta
} from "./chunk-LQEQZCXG.js";

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
export {
  buildLineDeepLink,
  buildLineOrderDeepLink,
  buildProductOrderMessage,
  getMinPaidSpecPrice,
  getOptionPricedStartLabel,
  resolveOrderSelectionRows,
  updatePageMeta
};
//# sourceMappingURL=index.js.map