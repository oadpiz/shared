export { P as PageMetaCleanup, a as PageMetaDefaults, b as PageMetaInput, u as updatePageMeta } from './pageMeta-DD8lSiSl.js';

/**
 * @oadpiz/shared 的共用商品規格型別。
 *
 * 刻意保持最小結構（structural typing）：lecake / shennong 等專案手上更完整的
 * `Product` 型別（多出 `title`、`imageUrl`… 等欄位）可以直接傳入，不需轉換；
 * 只要形狀相容即可。新專案也只需提供這些欄位。
 */
/** 商品規格選項值（如「6吋 +NT$300」）。 */
interface ProductOptionValue {
    /** 後端持久化 ID；送單時用來精確辨識同名選項值。 */
    id: string;
    /** 顯示文字（如「4吋愛心蛋糕」）。 */
    value: string;
    /** 加價金額（正數加價、0 不加價）。 */
    priceModifier: number;
}
/** 商品規格選項的型別。 */
type ProductOptionType = 'select' | 'radio' | 'checkbox' | 'text';
/** 商品規格選項（如蛋糕體口味、內餡選擇、加購項目、備註）。 */
interface ProductOption {
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
type ProductOptionSelections = Record<string, string | string[]>;
/** 組合規格（variant）的最小形狀；lecake 的 `ProductVariantOption` 可直接傳入。 */
interface ProductVariant {
    id: string;
    name: string;
    price: number;
    /** 此組合算幾件（階梯贈品用）；未提供以 1 計。 */
    quantityInBundle?: number;
}
/** 價格 / 規格計算所需的最小商品形狀。 */
interface ProductPriceSpecs {
    /** 商品基準價（矩陣定價商品已被後端映射為第一個 variant 的價）。 */
    price: number;
    /** 組合規格清單；無則 undefined / null。 */
    variants?: ProductVariant[] | null;
    /** 選項清單；無則 undefined / null。 */
    options?: ProductOption[] | null;
}
/** 可辨識「待店家報價」客製商品的最小形狀（id / sku / handle 任一命中即比對）。 */
interface QuoteOnlyProductHints {
    id?: string;
    sku?: string | null;
    handle?: string | null;
}

/**
 * 價格顯示輔助（純函式、零依賴）。
 *
 * 來源：lecake `lib/priceDisplay.ts`。price=0 但有付費規格選項的商品（規格價在
 * variants / options），以「依選項計價，NT$ X 起」取代「NT$ 0」的勸退感；
 * price>0 商品維持原顯示。
 */

/** 價格顯示函式可接受的商品形狀（lecake / shennong 的完整 Product 皆相容）。 */
type PriceDisplayProduct = ProductPriceSpecs & QuoteOnlyProductHints;
/** `getOptionPricedStartLabel` 的注入選項（lecake 特有的客製蛋糕判定改由此注入）。 */
interface GetOptionPricedStartLabelOptions {
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
declare function getMinPaidSpecPrice(product: ProductPriceSpecs): number | null;
/**
 * price=0 且有付費規格選項時，回「依選項計價，NT$ 1,180 起」；
 * 其他情況（已選規格有價、price>0、待店家報價商品、無付費規格）回 `null`，
 * 由呼叫端沿用原顯示。
 *
 * @param product 商品（至少帶 price / variants / options）
 * @param effectivePrice 目前生效的價格（商品價／已選變體價＋選項加價）
 * @param options 注入「待店家報價」判定（lecake 遷移指南見 README）
 */
declare function getOptionPricedStartLabel(product: PriceDisplayProduct, effectivePrice: number, options?: GetOptionPricedStartLabelOptions): string | null;

/**
 * 「LINE 立即訂購」轉單輔助（純函式、零依賴）：官方帳號深連結與預填訊息產生。
 *
 * 來源：lecake `lib/lineOrder.ts`。差異：LECake 原本的模組常數 `LINE_OFFICIAL_ID`
 * 已改為參數注入（每個專案/每個店家各自的官方帳號 ID，不含 `@`），
 * 共用套件不再綁定特定店家。
 */

/** 店家 LINE 官方帳號 ID（不含 `@`，如 `600kifjk`）。 */
type LineOfficialId = string;
/**
 * 建立 LINE 官方帳號深連結；有 message 時以 `?text=` 帶預填訊息
 * （`https://line.me/R/ti/p/@ID?text=...` 支援好友開啟時預填文字，中文會正確 URL encode）。
 *
 * @param officialId 店家 LINE 官方帳號 ID（不含 `@`）；空白視為程式錯誤，直接拋錯
 * @param message 預填訊息；全空白/不給則回不帶 `?text=` 的純深連結
 */
declare function buildLineDeepLink(officialId: LineOfficialId, message?: string | null): string;
/** 預填訊息中的一行規格：選項名稱＋選到的值（或多選值以「、」串接）。 */
interface LineOrderSelectionRow {
    label: string;
    value: string;
}
/**
 * 把商品規格選取狀態（optionId → valueId / valueId[] / 文字）轉成可讀的規格行。
 * 未選的選項、全空白文字、對不到值的選取都會略過。
 *
 * @param product 商品（只需要 `options`）
 * @param selectedOptions 使用者目前的選取狀態
 */
declare function resolveOrderSelectionRows(product: Pick<LineOrderProduct, 'options'>, selectedOptions?: ProductOptionSelections): LineOrderSelectionRow[];
/** `resolveOrderSelectionRows` 可接受的商品形狀。 */
interface LineOrderProduct {
    /** 規格選項清單；無則 undefined / null。 */
    options?: ProductOption[] | null;
}
/** 「LINE 立即訂購」預填訊息的組成材料。 */
interface LineOrderDraft {
    productTitle: string;
    /** 選到的組合規格名（如「6吋」）；矩陣定價商品由選項行呈現、可不帶。 */
    variantName?: string | null;
    /** 已選規格行（`resolveOrderSelectionRows` 的結果）。 */
    selectionRows?: LineOrderSelectionRow[];
    /** 已選規格的估價（如「NT$ 1,180」）；無明確價格（待報價）可不帶。 */
    priceLabel?: string | null;
}
/**
 * 產生「LINE 立即訂購」預填訊息；格式自然、多行。
 * 未選任何規格時只帶商品名稱，改為「詢問訂購資訊」語氣。
 */
declare function buildProductOrderMessage(draft: LineOrderDraft): string;
/**
 * 一口氣組出「LINE 立即訂購」深連結：`buildLineDeepLink(officialId, buildProductOrderMessage(draft))`
 * 的便捷組合，商品卡／商品頁的轉單按鈕一行搞定。
 */
declare function buildLineOrderDeepLink(officialId: LineOfficialId, draft: LineOrderDraft): string;

export { type GetOptionPricedStartLabelOptions, type LineOfficialId, type LineOrderDraft, type LineOrderProduct, type LineOrderSelectionRow, type PriceDisplayProduct, type ProductOption, type ProductOptionSelections, type ProductOptionType, type ProductOptionValue, type ProductPriceSpecs, type ProductVariant, type QuoteOnlyProductHints, buildLineDeepLink, buildLineOrderDeepLink, buildProductOrderMessage, getMinPaidSpecPrice, getOptionPricedStartLabel, resolveOrderSelectionRows };
