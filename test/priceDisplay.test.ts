import { describe, expect, it } from 'vitest';
import { getMinPaidSpecPrice, getOptionPricedStartLabel, type PriceDisplayProduct } from '../src';

/**
 * 遷移自 lecake `lib/__tests__/priceDisplay.test.ts`（對應測項逐條搬遷）。
 * 差異：lecake 專屬的 `isCustomizableProduct` 判定改以 `quoteOnlySlugs` 注入。
 */

/** 線上「情人節特惠款」形態：price=0、無 variants、單一 select option 帶規格價 */
function valentineProduct(overrides: Partial<PriceDisplayProduct> = {}): PriceDisplayProduct {
  return {
    id: 'valentine',
    price: 0,
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
    ],
    ...overrides,
  };
}

/** 客製蛋糕 sentinel 商品（slug cake-custom-order）：已有「待店家確認報價」流程 */
function customCakeProduct(): PriceDisplayProduct {
  return valentineProduct({
    id: 'cec01b0d',
    sku: 'cake-custom-order',
    handle: 'cake-custom-order',
    options: [
      {
        id: 'opt-line',
        name: 'Line',
        type: 'select',
        required: true,
        values: [{ id: 'v-custom', value: '客製化', priceModifier: 0 }],
      },
    ],
  });
}

/** lecake 遷移時的注入設定：待報價 slug */
const LECAKE_QUOTE_ONLY = { quoteOnlySlugs: ['cake-custom-order'] } as const;

describe('getOptionPricedStartLabel', () => {
  it('shows 依選項計價 with the lowest paid option price when price=0', () => {
    expect(getOptionPricedStartLabel(valentineProduct(), 0)).toBe('依選項計價，NT$ 1,180 起');
  });

  it('returns null once an effective price exists (spec selected)', () => {
    expect(getOptionPricedStartLabel(valentineProduct(), 1180)).toBeNull();
  });

  it('returns null for products with a positive base price', () => {
    expect(getOptionPricedStartLabel(valentineProduct({ price: 650 }), 650)).toBeNull();
  });

  it('uses the cheapest positive variant price when variants carry the price', () => {
    const product = valentineProduct({
      price: 0,
      options: undefined,
      variants: [
        { id: 'v1', name: '6吋', price: 0, quantityInBundle: 1 },
        { id: 'v2', name: '8吋', price: 1680, quantityInBundle: 1 },
        { id: 'v3', name: '10吋', price: 1180, quantityInBundle: 1 },
      ],
    });
    expect(getOptionPricedStartLabel(product, 0)).toBe('依選項計價，NT$ 1,180 起');
  });

  it('takes the lower of variant and option-based start prices', () => {
    const product = valentineProduct({
      variants: [{ id: 'v1', name: '分享組', price: 1500, quantityInBundle: 1 }],
    });
    expect(getOptionPricedStartLabel(product, 0)).toBe('依選項計價，NT$ 1,180 起');
  });

  it('returns null for the custom-cake product (handled by 待店家確認報價)', () => {
    // lecake 版靠模組內建的 isCustomizableProduct；共用版以 quoteOnlySlugs 注入
    expect(getOptionPricedStartLabel(customCakeProduct(), 0, LECAKE_QUOTE_ONLY)).toBeNull();
  });

  it('returns null when price=0 and there is no paid spec at all', () => {
    const product = valentineProduct({
      options: [
        { id: 'o', name: '選擇', type: 'select', required: true, values: [{ id: 'v', value: '原味', priceModifier: 0 }] },
      ],
    });
    expect(getOptionPricedStartLabel(product, 0)).toBeNull();
  });
});

describe('getMinPaidSpecPrice', () => {
  it('is price + smallest positive modifier for option-priced products', () => {
    expect(getMinPaidSpecPrice(valentineProduct())).toBe(1180);
  });

  it('uses base price when computing the option floor', () => {
    expect(getMinPaidSpecPrice(valentineProduct({ price: 500 }))).toBe(1680);
  });

  it('ignores text options and non-positive modifiers', () => {
    const product = valentineProduct({
      price: 0,
      options: [
        { id: 't', name: '備註', type: 'text', required: false, values: [] },
        {
          id: 's',
          name: '尺寸',
          type: 'radio',
          required: true,
          values: [
            { id: 'a', value: '小', priceModifier: 0 },
            { id: 'b', value: '大', priceModifier: 300 },
          ],
        },
      ],
    });
    expect(getMinPaidSpecPrice(product)).toBe(300);
  });

  it('returns null when nothing paid exists', () => {
    expect(getMinPaidSpecPrice(customCakeProduct())).toBeNull();
    expect(getMinPaidSpecPrice({ price: 0, variants: undefined, options: undefined })).toBeNull();
  });
});

describe('quote-only injection（共用版新增）', () => {
  it('quoteOnlySlugs suppresses the label even when paid specs exist', () => {
    // 待報價商品即使帶付費規格，也不顯示起價（走「待店家確認報價」）
    const product = valentineProduct({ sku: 'Cake-Custom-Order ' }); // 驗證 trim + 大小寫不敏感
    expect(getOptionPricedStartLabel(product, 0)).toBe('依選項計價，NT$ 1,180 起');
    expect(getOptionPricedStartLabel(product, 0, LECAKE_QUOTE_ONLY)).toBeNull();
  });

  it('isQuoteOnly predicate is preferred when both injections are given', () => {
    const product = valentineProduct({ id: 'quote-me' });
    const opts = {
      ...LECAKE_QUOTE_ONLY,
      isQuoteOnly: (p: PriceDisplayProduct) => p.id === 'quote-me',
    };
    expect(getOptionPricedStartLabel(product, 0, opts)).toBeNull();
  });

  it('handle / id also match quoteOnlySlugs', () => {
    expect(getOptionPricedStartLabel(valentineProduct({ handle: 'cake-custom-order' }), 0, LECAKE_QUOTE_ONLY)).toBeNull();
    expect(getOptionPricedStartLabel(valentineProduct({ id: 'cake-custom-order' }), 0, LECAKE_QUOTE_ONLY)).toBeNull();
  });
});
