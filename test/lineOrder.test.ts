import { describe, expect, it } from 'vitest';
import {
  buildLineDeepLink,
  buildLineOrderDeepLink,
  buildProductOrderMessage,
  resolveOrderSelectionRows,
  type ProductOption,
  type ProductOptionSelections,
} from '../src';

/**
 * 遷移自 lecake `lib/__tests__/lineOrder.test.ts`（對應測項逐條搬遷）。
 * 差異：LINE 官方帳號 ID 改為參數注入（lecake 常數 600kifjk 在測試端帶回）。
 */

const LINE_OFFICIAL_ID = '600kifjk'; // lecake 店家官方帳號；共用套件不再綁定單一店家
const HERO_LINE_INQUIRY_TEXT = '你好，我想詢問蛋糕訂購'; // lecake 首頁 Hero 預填文字（留在專案端）

/** 依線上 /api/products「情人節特惠款」實際結構建立的 fixture：price=0、規格價在 select option */
function makeValentineProduct(): { options: ProductOption[] } {
  return {
    options: [
      {
        id: 'opt-choice',
        name: '選擇',
        type: 'select',
        required: false,
        values: [
          { id: 'v-heart', value: '4吋愛心蛋糕', priceModifier: 1680 },
          { id: 'v-combo', value: '組合:4吋愛心蛋糕+氣球', priceModifier: 2979 },
          { id: 'v-square', value: '4吋方形蛋糕', priceModifier: 1180 },
        ],
      },
      {
        id: 'opt-note',
        name: '備註',
        type: 'text',
        required: false,
        values: [],
      },
      {
        id: 'opt-addon',
        name: '加購',
        type: 'checkbox',
        required: false,
        values: [
          { id: 'a-candle', value: '蠟燭', priceModifier: 30 },
          { id: 'a-plate', value: '紙盤', priceModifier: 20 },
        ],
      },
    ],
  };
}

describe('buildLineDeepLink', () => {
  it('opens the official account add-friend deep link without text', () => {
    expect(buildLineDeepLink(LINE_OFFICIAL_ID)).toBe(`https://line.me/R/ti/p/@${LINE_OFFICIAL_ID}`);
    expect(buildLineDeepLink('600kifjk', null)).toBe('https://line.me/R/ti/p/@600kifjk');
  });

  it('drops blank text instead of producing an empty ?text=', () => {
    expect(buildLineDeepLink('600kifjk', '   \n')).toBe('https://line.me/R/ti/p/@600kifjk');
  });

  it('appends ?text= with correctly URL-encoded Traditional Chinese', () => {
    const url = buildLineDeepLink(LINE_OFFICIAL_ID, HERO_LINE_INQUIRY_TEXT);
    expect(url.startsWith('https://line.me/R/ti/p/@600kifjk?text=')).toBe(true);
    // round-trip：用 URL parser 解回來應與原文一致（中文可讀、編碼正確）
    expect(new URL(url).searchParams.get('text')).toBe('你好，我想詢問蛋糕訂購');
  });

  it('encodes newlines in multi-line order messages', () => {
    const url = buildLineDeepLink(LINE_OFFICIAL_ID, '你好\n第二行');
    expect(new URL(url).searchParams.get('text')).toBe('你好\n第二行');
  });

  it('works for any official account id（共用版參數注入）', () => {
    expect(buildLineDeepLink('abc123', '嗨')).toBe('https://line.me/R/ti/p/@abc123?text=%E5%97%A8');
  });

  it('throws on blank officialId instead of emitting a broken link', () => {
    expect(() => buildLineDeepLink('  ')).toThrow(/officialId/);
  });
});

describe('buildProductOrderMessage', () => {
  it('only carries the product title when no spec is selected', () => {
    expect(buildProductOrderMessage({ productTitle: '情人節特惠款' })).toBe(
      '你好，我想詢問「情人節特惠款」的訂購資訊，謝謝！',
    );
  });

  it('includes title, variant, selection rows and price when a spec is chosen', () => {
    const message = buildProductOrderMessage({
      productTitle: '情人節特惠款',
      variantName: '6吋',
      selectionRows: [
        { label: '選擇', value: '4吋方形蛋糕' },
        { label: '備註', value: '生日快樂' },
      ],
      priceLabel: 'NT$ 1,180',
    });
    expect(message).toBe(
      [
        '你好，我想訂購「情人節特惠款」',
        '規格：6吋',
        '選擇：4吋方形蛋糕',
        '備註：生日快樂',
        '價格：NT$ 1,180',
        '再麻煩與我確認細節，謝謝！',
      ].join('\n'),
    );
  });

  it('omits the price line when there is no concrete price (custom quote flow)', () => {
    const message = buildProductOrderMessage({
      productTitle: '全客製化蛋糕',
      selectionRows: [{ label: '客製化', value: '客製化' }],
      priceLabel: null,
    });
    expect(message).toContain('你好，我想訂購「全客製化蛋糕」');
    expect(message).not.toContain('價格：');
  });
});

describe('resolveOrderSelectionRows', () => {
  it('maps select/checkbox/text selections to readable rows', () => {
    const product = makeValentineProduct();
    const selected: ProductOptionSelections = {
      'opt-choice': 'v-square',
      'opt-addon': ['a-candle', 'a-plate'],
      'opt-note': '生日快樂',
    };
    expect(resolveOrderSelectionRows(product, selected)).toEqual([
      { label: '選擇', value: '4吋方形蛋糕' },
      { label: '備註', value: '生日快樂' },
      { label: '加購', value: '蠟燭、紙盤' },
    ]);
  });

  it('skips unselected, blank-text and unknown-value selections', () => {
    const product = makeValentineProduct();
    expect(
      resolveOrderSelectionRows(product, {
        'opt-note': '   ',
        'opt-choice': 'v-unknown-id',
      }),
    ).toEqual([]);
    expect(resolveOrderSelectionRows(product, undefined)).toEqual([]);
    expect(resolveOrderSelectionRows({ options: undefined }, {})).toEqual([]);
  });

  it('keeps only known values in checkbox multi-select order', () => {
    const product = makeValentineProduct();
    const rows = resolveOrderSelectionRows(product, { 'opt-addon': ['a-plate', 'bogus'] });
    expect(rows).toEqual([{ label: '加購', value: '紙盤' }]);
  });
});

describe('buildLineOrderDeepLink（共用版新增）', () => {
  it('composes message + deep link in one call', () => {
    const url = buildLineOrderDeepLink(LINE_OFFICIAL_ID, {
      productTitle: '情人節特惠款',
      selectionRows: [{ label: '選擇', value: '4吋方形蛋糕' }],
      priceLabel: 'NT$ 1,180',
    });
    expect(url.startsWith('https://line.me/R/ti/p/@600kifjk?text=')).toBe(true);
    const text = new URL(url).searchParams.get('text') ?? '';
    expect(text.split('\n')).toEqual([
      '你好，我想訂購「情人節特惠款」',
      '選擇：4吋方形蛋糕',
      '價格：NT$ 1,180',
      '再麻煩與我確認細節，謝謝！',
    ]);
  });
});
