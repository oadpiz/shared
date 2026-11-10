# @oadpiz/shared

Oadpiz 跨專案共用純 TypeScript 邏輯——**零 UI 依賴、零 runtime 依賴**。
從 lecake 抽出、供 shennong 與未來新專案共用。

| 模組 | 內容 | 來源 |
|---|---|---|
| `priceDisplay` | price=0 的規格計價商品顯示「依選項計價，NT$ X 起」 | lecake `lib/priceDisplay.ts` |
| `lineOrder` | LINE 官方帳號深連結與「立即訂購」預填訊息 | lecake `lib/lineOrder.ts` |
| `pageMeta` | title / description / OG / Twitter / canonical upsert（framework-agnostic 核心 + React/Vue 薄殼） | lecake `lib/usePageMeta.ts`（完整版）、shennong `lib/usePageMeta.ts`（簡版） |

## 安裝

```bash
npm install -D @oadpiz/shared@github:oadpiz/shared#v0.1.0
```

Git 安裝會自動跑 `prepare`（從原始碼 build）；react / vue 是 **optional peer**，
只在你 import 對應薄殼時才需要存在。

## API

### priceDisplay

```ts
import { getMinPaidSpecPrice, getOptionPricedStartLabel } from '@oadpiz/shared';

getMinPaidSpecPrice(product);                    // number | null — 最小付費規格價
getOptionPricedStartLabel(product, 0, options?); // '依選項計價，NT$ 1,180 起' | null
```

- `product` 只需要 `{ price, variants?, options?, id?, sku?, handle? }`（structural typing，
  lecake/shennong 的完整 `Product` 可直接傳）。
- `options.isQuoteOnly?: (product) => boolean` 或 `options.quoteOnlySlugs?: string[]`：
  「待店家確認報價」商品不顯示起價。lecake 對應 `['cake-custom-order']`。

### lineOrder

```ts
import {
  buildLineDeepLink,        // (officialId, message?) => 'https://line.me/R/ti/p/@ID?text=...'
  buildProductOrderMessage, // (draft) => 多行預填訊息
  buildLineOrderDeepLink,   // (officialId, draft) => 上述兩者的組合
  resolveOrderSelectionRows // (product, selectedOptions?) => [{ label, value }]
} from '@oadpiz/shared';
```

官方帳號 ID（不含 `@`）一律由呼叫端注入——共用套件不綁定店家。
`buildProductOrderMessage` 吃 `LineOrderDraft { productTitle, variantName?, selectionRows?, priceLabel? }`；
未選規格時自動轉為「詢問訂購資訊」語氣。

### pageMeta

核心（任何框架／無框架）：

```ts
import { updatePageMeta } from '@oadpiz/shared';

const cleanup = updatePageMeta({
  title: '草莓蛋糕',            // → 「草莓蛋糕 | LE Cake」
  description: '當季草莓...',
  siteName: 'LE Cake',
  siteUrl: 'https://lecake.tw', // 缺省用 window.location.origin
  path: '/products/abc?from=line', // 缺省用 window.location
  image: '/og/cake.jpg',        // 相對路徑自動補成絕對；補不出來則略過
  defaults: { title: '... | LE Cake', description: '...' }, // fallback＋cleanup 還原目標
});
cleanup(); // 還原 title / description 成 defaults（module-level 常數）
```

設定範圍：`document.title`、`meta[name=description]`、`og:title/og:description/og:url/og:image`、
`twitter:title/twitter:description/twitter:url/twitter:image/twitter:card`、`link[rel=canonical]`。
SSR（無 `document`）為 no-op。

框架薄殼（subpath exports，核心入口不含任何框架 import）：

```ts
// React（useEffect 自動 cleanup）
import { usePageMeta } from '@oadpiz/shared/react';
usePageMeta({ title, description, siteName: 'LE Cake', defaults: SITE_DEFAULTS });

// Vue（watchEffect + scope dispose 自動 cleanup；可傳 ref / computed / getter）
import { usePageMeta } from '@oadpiz/shared/vue';
usePageMeta(computed(() => ({ title: page.value.title, siteName: '台中國農宮', defaults: SITE_DEFAULTS })));
```

## 遷移指南

### 從 lecake（priceDisplay）

```diff
- import { getMinPaidSpecPrice, getOptionPricedStartLabel } from '../lib/priceDisplay';
+ import { getMinPaidSpecPrice, getOptionPricedStartLabel } from '@oadpiz/shared';
```

lecake 原本模組內建的 `isCustomizableProduct` 判定改為注入：

```ts
import { isCustomizableProduct } from '../lib/orderCustomization';
// 二選一：
getOptionPricedStartLabel(product, effectivePrice, { isQuoteOnly: isCustomizableProduct });
getOptionPricedStartLabel(product, effectivePrice, { quoteOnlySlugs: ['cake-custom-order'] });
```

### 從 lecake（lineOrder）

```diff
- import { LINE_OFFICIAL_ID, HERO_LINE_INQUIRY_TEXT, buildLineDeepLink, buildProductOrderMessage, resolveOrderSelectionRows } from '../lib/lineOrder';
+ import { buildLineDeepLink, buildProductOrderMessage, buildLineOrderDeepLink, resolveOrderSelectionRows } from '@oadpiz/shared';
```

- `LINE_OFFICIAL_ID` 與 `HERO_LINE_INQUIRY_TEXT` 是 lecake 專屬常數，留在專案內（如 `constants.ts`）。
- `buildLineDeepLink` 簽名從 `(text?)` 改為 **`(officialId, message?)`**：

```diff
- const url = buildLineDeepLink('你好，我想訂購...');
+ const url = buildLineDeepLink(LINE_OFFICIAL_ID, '你好，我想訂購...');
```

- `buildProductOrderMessage(draft)`、`resolveOrderSelectionRows(product, selected)` 簽名不變。
- `Product` / `ProductOption` / `ProductOptionSelections` 型別可用共套的，或續用專案自己的（structural typing 相容）。

### 從 lecake / shennong（usePageMeta）

```diff
- import { usePageMeta } from '../lib/usePageMeta';            // lecake：usePageMeta(title, description)
+ import { usePageMeta } from '@oadpiz/shared/react';
+ // SITE_DEFAULTS 放 module level（stable reference）
+ const SITE_DEFAULTS = { title: 'LE Cake 蛋糕與客製甜點 | LE Cake', description: DEFAULT_DESC };
- usePageMeta(title, description);
+ usePageMeta({ title, description, siteName: 'LE Cake', defaults: SITE_DEFAULTS });
```

shennong 同理（站名 `台中國農宮`、defaults.title 用 `台中國農宮 - 神農大帝線上結緣所`）。
Vue 專案改用 `@oadpiz/shared/vue`。無框架環境直接用核心 `updatePageMeta`。
siteName 後綴、OG/Twitter/canonical 行為與 lecake 版一致，另外新增 `image` 支援。

## 開發

```bash
npm install
npm test          # vitest（純函式走 node env；pageMeta/薄殼測試走 jsdom）
npm run build     # tsc --noEmit + tsup（ESM + CJS + d.ts，入口 ./ ./react ./vue）
```

- TypeScript strict、ESM+CJS dual exports、`sideEffects: false`。
- 測試中的 `priceDisplay` / `lineOrder` 測項遷移自 lecake `lib/__tests__/`（行為逐條對齊）。
- 新模組請保持：純 TypeScript、零 runtime 依賴、JSDoc、vitest 測試。
