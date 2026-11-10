/**
 * 價格顯示輔助（純函式、零依賴）。
 *
 * 來源：lecake `lib/priceDisplay.ts`。price=0 但有付費規格選項的商品（規格價在
 * variants / options），以「依選項計價，NT$ X 起」取代「NT$ 0」的勸退感；
 * price>0 商品維持原顯示。
 */
import type { ProductPriceSpecs, QuoteOnlyProductHints } from './types';

/** 價格顯示函式可接受的商品形狀（lecake / shennong 的完整 Product 皆相容）。 */
export type PriceDisplayProduct = ProductPriceSpecs & QuoteOnlyProductHints;

/** `getOptionPricedStartLabel` 的注入選項（lecake 特有的客製蛋糕判定改由此注入）。 */
export interface GetOptionPricedStartLabelOptions {
  /**
   * 自訂「待店家確認報價」商品判定（回 true 一律不顯示起價標籤）。
   * lecake 遷移時傳自己的 `isCustomizableProduct`。
   */
  isQuoteOnly?: (product: PriceDisplayProduct) => boolean;
  /**
   * 或者只給 slug 清單：商品的 id / sku / handle 任一（去前後空白、大小寫不敏感）
   * 等於其中之一即視為「待店家確認報價」。lecake 對應 `['cake-custom-order']`。
   */
  quoteOnlySlugs?: readonly string[];
}

/**
 * 商品最低付費規格價：
 * - 有 variants：取最小正價（product.price 已被後端映射為第一個 variant 的價）。
 * - 有 options：取 price ＋ 最小正 priceModifier（text 類型無價、不計）。
 * 兩者皆有取較小者；沒有任何付費規格時回 `null`。
 */
export function getMinPaidSpecPrice(product: ProductPriceSpecs): number | null {
  const candidates: number[] = [];
  const variantPrices = (product.variants ?? [])
    .map((variant) => variant.price)
    .filter((price) => Number.isFinite(price) && price > 0);
  if (variantPrices.length > 0) candidates.push(Math.min(...variantPrices));
  const modifiers = (product.options ?? [])
    .flatMap((option) => (option.type === 'text' ? [] : option.values.map((value) => value.priceModifier)))
    .filter((modifier) => Number.isFinite(modifier) && modifier > 0);
  if (modifiers.length > 0) candidates.push(Math.max(product.price, 0) + Math.min(...modifiers));
  if (candidates.length === 0) return null;
  return Math.round(Math.min(...candidates));
}

/** 判斷是否為「待店家確認報價」商品：優先使用注入的 predicate，其次比對 slug 清單。 */
function isQuoteOnlyProduct(
  product: PriceDisplayProduct,
  options?: GetOptionPricedStartLabelOptions,
): boolean {
  if (options?.isQuoteOnly) return options.isQuoteOnly(product);
  const slugs = options?.quoteOnlySlugs;
  if (!slugs || slugs.length === 0) return false;
  const targets = new Set(slugs.map((slug) => slug.trim().toLowerCase()));
  return [product.id, product.sku, product.handle].some(
    (value) => typeof value === 'string' && targets.has(value.trim().toLowerCase()),
  );
}

/**
 * price=0 且有付費規格選項時，回「依選項計價，NT$ 1,180 起」；
 * 其他情況（已選規格有價、price>0、待店家報價商品、無付費規格）回 `null`，
 * 由呼叫端沿用原顯示。
 *
 * @param product 商品（至少帶 price / variants / options）
 * @param effectivePrice 目前生效的價格（商品價／已選變體價＋選項加價）
 * @param options 注入「待店家報價」判定（lecake 遷移指南見 README）
 */
export function getOptionPricedStartLabel(
  product: PriceDisplayProduct,
  effectivePrice: number,
  options?: GetOptionPricedStartLabelOptions,
): string | null {
  if (effectivePrice > 0) return null;
  if (isQuoteOnlyProduct(product, options)) return null; // 客製商品走「待店家確認報價」
  const startPrice = getMinPaidSpecPrice(product);
  if (startPrice == null) return null;
  return `依選項計價，NT$ ${startPrice.toLocaleString()} 起`;
}
