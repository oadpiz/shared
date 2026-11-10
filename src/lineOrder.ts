/**
 * 「LINE 立即訂購」轉單輔助（純函式、零依賴）：官方帳號深連結與預填訊息產生。
 *
 * 來源：lecake `lib/lineOrder.ts`。差異：LECake 原本的模組常數 `LINE_OFFICIAL_ID`
 * 已改為參數注入（每個專案/每個店家各自的官方帳號 ID，不含 `@`），
 * 共用套件不再綁定特定店家。
 */
import type { ProductOption, ProductOptionSelections } from './types';

/** 店家 LINE 官方帳號 ID（不含 `@`，如 `600kifjk`）。 */
export type LineOfficialId = string;

/**
 * 建立 LINE 官方帳號深連結；有 message 時以 `?text=` 帶預填訊息
 * （`https://line.me/R/ti/p/@ID?text=...` 支援好友開啟時預填文字，中文會正確 URL encode）。
 *
 * @param officialId 店家 LINE 官方帳號 ID（不含 `@`）；空白視為程式錯誤，直接拋錯
 * @param message 預填訊息；全空白/不給則回不帶 `?text=` 的純深連結
 */
export function buildLineDeepLink(officialId: LineOfficialId, message?: string | null): string {
  const trimmedId = officialId.trim();
  if (!trimmedId) {
    throw new Error('buildLineDeepLink: officialId is required（LINE 官方帳號 ID，不含 @）');
  }
  const base = `https://line.me/R/ti/p/@${trimmedId}`;
  const trimmed = message?.trim() ?? '';
  return trimmed ? `${base}?text=${encodeURIComponent(trimmed)}` : base;
}

/** 預填訊息中的一行規格：選項名稱＋選到的值（或多選值以「、」串接）。 */
export interface LineOrderSelectionRow {
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
export function resolveOrderSelectionRows(
  product: Pick<LineOrderProduct, 'options'>,
  selectedOptions?: ProductOptionSelections,
): LineOrderSelectionRow[] {
  const rows: LineOrderSelectionRow[] = [];
  for (const option of product.options ?? []) {
    const selected = selectedOptions?.[option.id];
    if (!selected) continue;
    if (option.type === 'text') {
      const text = typeof selected === 'string' ? selected.trim() : '';
      if (text) rows.push({ label: option.name, value: text });
      continue;
    }
    const valueIds = Array.isArray(selected) ? selected : [selected];
    const texts = valueIds
      .map((valueId) => option.values.find((value) => value.id === valueId)?.value)
      .filter((value): value is string => !!value);
    if (texts.length > 0) rows.push({ label: option.name, value: texts.join('、') });
  }
  return rows;
}

/** `resolveOrderSelectionRows` 可接受的商品形狀。 */
export interface LineOrderProduct {
  /** 規格選項清單；無則 undefined / null。 */
  options?: ProductOption[] | null;
}

/** 「LINE 立即訂購」預填訊息的組成材料。 */
export interface LineOrderDraft {
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
export function buildProductOrderMessage(draft: LineOrderDraft): string {
  const hasSpec = !!draft.variantName || (draft.selectionRows?.length ?? 0) > 0;
  if (!hasSpec && !draft.priceLabel) {
    return `你好，我想詢問「${draft.productTitle}」的訂購資訊，謝謝！`;
  }
  const lines: string[] = [`你好，我想訂購「${draft.productTitle}」`];
  if (draft.variantName) lines.push(`規格：${draft.variantName}`);
  for (const row of draft.selectionRows ?? []) lines.push(`${row.label}：${row.value}`);
  if (draft.priceLabel) lines.push(`價格：${draft.priceLabel}`);
  lines.push('再麻煩與我確認細節，謝謝！');
  return lines.join('\n');
}

/**
 * 一口氣組出「LINE 立即訂購」深連結：`buildLineDeepLink(officialId, buildProductOrderMessage(draft))`
 * 的便捷組合，商品卡／商品頁的轉單按鈕一行搞定。
 */
export function buildLineOrderDeepLink(officialId: LineOfficialId, draft: LineOrderDraft): string {
  return buildLineDeepLink(officialId, buildProductOrderMessage(draft));
}
