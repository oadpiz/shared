/**
 * @oadpiz/shared 的共用商品規格型別。
 *
 * 刻意保持最小結構（structural typing）：lecake / shennong 等專案手上更完整的
 * `Product` 型別（多出 `title`、`imageUrl`… 等欄位）可以直接傳入，不需轉換；
 * 只要形狀相容即可。新專案也只需提供這些欄位。
 */

/** 商品規格選項值（如「6吋 +NT$300」）。 */
export interface ProductOptionValue {
  /** 後端持久化 ID；送單時用來精確辨識同名選項值。 */
  id: string;
  /** 顯示文字（如「4吋愛心蛋糕」）。 */
  value: string;
  /** 加價金額（正數加價、0 不加價）。 */
  priceModifier: number;
}

/** 商品規格選項的型別。 */
export type ProductOptionType = 'select' | 'radio' | 'checkbox' | 'text';

/** 商品規格選項（如蛋糕體口味、內餡選擇、加購項目、備註）。 */
export interface ProductOption {
  /** 後端持久化 ID；後台編輯既有選項時必須原樣帶回。 */
  id: string;
  /** 選項名稱，顯示給消費者（如「選擇」、「備註」）。 */
  name: string;
  type: ProductOptionType;
  /** 是否必選。 */
  required: boolean;
  values: ProductOptionValue[];
}

/** optionId → valueId / valueId[]；text 選項則保存原始文字。 */
export type ProductOptionSelections = Record<string, string | string[]>;

/** 組合規格（variant）的最小形狀；lecake 的 `ProductVariantOption` 可直接傳入。 */
export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  /** 此組合算幾件（階梯贈品用）；未提供以 1 計。 */
  quantityInBundle?: number;
}

/** 價格 / 規格計算所需的最小商品形狀。 */
export interface ProductPriceSpecs {
  /** 商品基準價（矩陣定價商品已被後端映射為第一個 variant 的價）。 */
  price: number;
  /** 組合規格清單；無則 undefined / null。 */
  variants?: ProductVariant[] | null;
  /** 選項清單；無則 undefined / null。 */
  options?: ProductOption[] | null;
}

/** 可辨識「待店家報價」客製商品的最小形狀（id / sku / handle 任一命中即比對）。 */
export interface QuoteOnlyProductHints {
  id?: string;
  sku?: string | null;
  handle?: string | null;
}
