import { MaybeRefOrGetter } from 'vue';
import { b as PageMetaInput } from './pageMeta-DD8lSiSl.cjs';

/**
 * Vue 薄殼：`updatePageMeta` 的 composable。
 *
 * 依賴 vue（optional peer，>=3.2），由消費端專案提供——本套件核心零 runtime 依賴。
 * 使用：`import { usePageMeta } from '@oadpiz/shared/vue'`。
 */

/**
 * 設定當前頁面的 title / description / OG / Twitter / canonical。
 * meta 可以是 ref / getter / computed，變更時自動重設；scope 結束（元件卸載）時
 * 還原 defaults。
 *
 * @param meta 頁面 meta（可直接傳 reactive 物件）
 *
 * @example
 * ```ts
 * const SITE_DEFAULTS = { title: '台中國農宮 - 神農大帝線上結緣所', description: '…' };
 * usePageMeta(computed(() => ({ title: page.value.title, siteName: '台中國農宮', defaults: SITE_DEFAULTS })));
 * ```
 */
declare function usePageMeta(meta: MaybeRefOrGetter<PageMetaInput>): void;

export { usePageMeta };
