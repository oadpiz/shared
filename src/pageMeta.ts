/**
 * 頁面 meta（title / description / OG / Twitter / canonical）的 framework-agnostic 核心。
 *
 * 來源：lecake `lib/usePageMeta.ts`（完整 OG/Twitter/canonical upsert 版）。
 * 共用版直接操作 `document.head`，不依賴任何框架；React hook 與 Vue composable
 * 薄殼見 `@oadpiz/shared/react`、`@oadpiz/shared/vue`。
 */

/** 還原函式：把 title / description 還原成 defaults（未提供 defaults 則為 no-op）。 */
export type PageMetaCleanup = () => void;

/** title / description 缺漏時的 fallback，同時也是 cleanup 的還原目標。 */
export interface PageMetaDefaults {
  /** 「完整」fallback 標題（已含站名後綴，如 `LE Cake 蛋糕與客製甜點 | LE Cake`）。 */
  title: string;
  /** fallback description（LECake 的 DEFAULT_DESC、shennong 的站描述）。 */
  description: string;
}

/** `updatePageMeta` 的輸入。 */
export interface PageMetaInput {
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

/** 找不到就建立、找得到就覆寫的 meta upsert。 */
function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string): void {
  let meta = document.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/** canonical link 的 upsert。 */
function upsertCanonical(url: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

/** 相對路徑 → 絕對 URL（已是絕對 URL 原樣回傳）；組不出絕對 URL 時回空字串。 */
function resolveAbsoluteUrl(origin: string, pathOrUrl: string | undefined): string {
  if (pathOrUrl == null) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!origin) return '';
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
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
export function updatePageMeta(meta: PageMetaInput): PageMetaCleanup {
  if (typeof document === 'undefined') return () => undefined;

  const pageTitle = meta.title?.trim() ?? '';
  const fullTitle = pageTitle
    ? (meta.siteName ? `${pageTitle} | ${meta.siteName}` : pageTitle)
    : (meta.defaults?.title ?? meta.siteName ?? '');

  const origin = meta.siteUrl?.replace(/\/+$/, '') || (typeof window !== 'undefined' ? window.location.origin : '');
  let path = meta.path;
  if (path == null && typeof window !== 'undefined') {
    path = `${window.location.pathname}${window.location.search}`;
  }
  const canonical = resolveAbsoluteUrl(origin, path);
  const image = resolveAbsoluteUrl(origin, meta.image);

  if (fullTitle) document.title = fullTitle;

  const description = meta.description?.trim() || meta.defaults?.description || '';
  if (description) {
    upsertMeta('meta[name="description"]', 'name', 'description', description);
  }
  if (fullTitle) {
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
  }
  if (description) {
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  }

  if (canonical) {
    upsertCanonical(canonical);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    upsertMeta('meta[name="twitter:url"]', 'name', 'twitter:url', canonical);
  }
  if (image) {
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', image);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  }

  const defaults = meta.defaults;
  return () => {
    if (!defaults) return;
    if (defaults.title) document.title = defaults.title;
    if (defaults.description) {
      upsertMeta('meta[name="description"]', 'name', 'description', defaults.description);
    }
  };
}
