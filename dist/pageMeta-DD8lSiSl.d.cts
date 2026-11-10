/**
 * 頁面 meta（title / description / OG / Twitter / canonical）的 framework-agnostic 核心。
 *
 * 來源：lecake `lib/usePageMeta.ts`（完整 OG/Twitter/canonical upsert 版）。
 * 共用版直接操作 `document.head`，不依賴任何框架；React hook 與 Vue composable
 * 薄殼見 `@oadpiz/shared/react`、`@oadpiz/shared/vue`。
 */
/** 還原函式：把 title / description 還原成 defaults（未提供 defaults 則為 no-op）。 */
type PageMetaCleanup = () => void;
/** title / description 缺漏時的 fallback，同時也是 cleanup 的還原目標。 */
interface PageMetaDefaults {
    /** 「完整」fallback 標題（已含站名後綴，如 `LE Cake 蛋糕與客製甜點 | LE Cake`）。 */
    title: string;
    /** fallback description（LECake 的 DEFAULT_DESC、shennong 的站描述）。 */
    description: string;
}
/** `updatePageMeta` 的輸入。 */
interface PageMetaInput {
    /** 頁面標題（不含站名後綴）；有 siteName 時組成 `{title} | {siteName}`。 */
    title?: string;
    /** 頁面 description；缺漏時用 defaults.description。 */
    description?: string;
    /** canonical 相對路徑（含 query，如 `/products/abc?from=line`）或絕對 URL；缺省用當前 window.location。 */
    path?: string;
    /** og:image / twitter:image 圖檔；相對路徑會以 siteUrl 補成絕對 URL。 */
    image?: string;
    /** 站台 origin（如 `https://lecake.tw`）；缺省用 window.location.origin。 */
    siteUrl?: string;
    /** 站名，作為 title 後綴（如 `LE Cake`）。 */
    siteName?: string;
    /** fallback（建議放 module-level 常數，避免每次 render 重建）。 */
    defaults?: PageMetaDefaults;
}
/**
 * 一次設定當前頁面的 document.title、meta description、OG / Twitter 與 canonical：
 *
 * - title：`{title} | {siteName}`（有 siteName 時）；title 缺漏用 `defaults.title`。
 * - description：缺漏時用 `defaults.description`（兩者皆無則不動現有 meta）。
 * - canonical：`{siteUrl}{path}`（缺 siteUrl 用 window.location.origin、缺 path 用
 *   window.location.pathname+search）；組不出絕對 URL（如 SSR 無 window）則略過。
 * - image：og:image / twitter:image + `twitter:card=summary_large_image`；
 *   相對路徑無法補成絕對 URL 時略過。
 *
 * @returns 還原函式：把 title / description 還原成 defaults（OG/Twitter/canonical 不還原，
 *   與 lecake 行為一致）。SSR（無 document）環境為 no-op。
 */
declare function updatePageMeta(meta: PageMetaInput): PageMetaCleanup;

export { type PageMetaCleanup as P, type PageMetaDefaults as a, type PageMetaInput as b, updatePageMeta as u };
