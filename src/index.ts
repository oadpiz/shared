/**
 * @oadpiz/shared — Oadpiz 跨專案共用純 TypeScript 邏輯（零 UI 依賴、零 runtime 依賴）。
 *
 * - `priceDisplay`：price=0 的規格計價商品顯示「依選項計價，NT$ X 起」
 * - `lineOrder`：LINE 官方帳號深連結與「立即訂購」預填訊息
 * - `pageMeta`：title / description / OG / Twitter / canonical 的 framework-agnostic 核心
 *
 * 框架薄殼（不在此入口，保持核心零框架依賴）：
 * - React hook：`import { usePageMeta } from '@oadpiz/shared/react'`
 * - Vue composable：`import { usePageMeta } from '@oadpiz/shared/vue'`
 */

export {
  getMinPaidSpecPrice,
  getOptionPricedStartLabel,
  type GetOptionPricedStartLabelOptions,
  type PriceDisplayProduct,
} from './priceDisplay';

export {
  buildLineDeepLink,
  buildLineOrderDeepLink,
  buildProductOrderMessage,
  resolveOrderSelectionRows,
  type LineOfficialId,
  type LineOrderDraft,
  type LineOrderProduct,
  type LineOrderSelectionRow,
} from './lineOrder';

export {
  updatePageMeta,
  type PageMetaCleanup,
  type PageMetaDefaults,
  type PageMetaInput,
} from './pageMeta';

export {
  type ProductOption,
  type ProductOptionSelections,
  type ProductOptionType,
  type ProductOptionValue,
  type ProductPriceSpecs,
  type ProductVariant,
  type QuoteOnlyProductHints,
} from './types';
