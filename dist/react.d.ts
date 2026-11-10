import { b as PageMetaInput } from './pageMeta-DD8lSiSl.js';

/**
 * 設定當前頁面的 title / description / OG / Twitter / canonical（unmount 時還原 defaults）。
 *
 * @param meta 頁面 meta；`defaults` 建議為 module-level 常數（以穩定 reference 進入 deps）
 *
 * @example
 * ```tsx
 * const SITE_DEFAULTS = { title: 'LE Cake 蛋糕與客製甜點 | LE Cake', description: '…' };
 * usePageMeta({ title: '草莓蛋糕', siteName: 'LE Cake', defaults: SITE_DEFAULTS });
 * ```
 */
declare function usePageMeta(meta: PageMetaInput): void;

export { usePageMeta };
