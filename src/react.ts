/**
 * React 薄殼：`updatePageMeta` 的 `useEffect` 包裝。
 *
 * 依賴 react（optional peer，>=17），由消費端專案提供——本套件核心零 runtime 依賴。
 * 使用：`import { usePageMeta } from '@oadpiz/shared/react'`。
 */
import { useEffect } from 'react';
import { updatePageMeta, type PageMetaInput } from './pageMeta';

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
export function usePageMeta(meta: PageMetaInput): void {
  const { title, description, path, image, siteUrl, siteName, defaults } = meta;
  useEffect(
    () => updatePageMeta({ title, description, path, image, siteUrl, siteName, defaults }),
    [title, description, path, image, siteUrl, siteName, defaults],
  );
}
