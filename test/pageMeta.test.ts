// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { updatePageMeta } from '../src';

const SITE_DEFAULTS = {
  title: 'LE Cake 蛋糕與客製甜點 | LE Cake',
  description: 'LE Cake 提供客製化生日蛋糕、派對甜點、節慶禮盒與預訂取貨服務。',
};

function metaContent(selector: string): string | null {
  return document.querySelector<HTMLMetaElement>(selector)?.content ?? null;
}

afterEach(() => {
  vi.unstubAllGlobals(); // 先還原被 stub 的 window/document，再清 DOM
  document.head.innerHTML = '';
  document.title = '';
});

describe('updatePageMeta（framework-agnostic 核心）', () => {
  it('sets title with siteName suffix and falls back to defaults.title when title is blank', () => {
    updatePageMeta({ title: '草莓蛋糕', siteName: 'LE Cake', defaults: SITE_DEFAULTS });
    expect(document.title).toBe('草莓蛋糕 | LE Cake');

    updatePageMeta({ title: '   ', siteName: 'LE Cake', defaults: SITE_DEFAULTS });
    expect(document.title).toBe('LE Cake 蛋糕與客製甜點 | LE Cake');

    updatePageMeta({ siteName: 'LE Cake' });
    expect(document.title).toBe('LE Cake');
  });

  it('upserts description and og/twitter title+description', () => {
    updatePageMeta({ title: '草莓蛋糕', description: '當季草莓', siteName: 'LE Cake' });
    expect(metaContent('meta[name="description"]')).toBe('當季草莓');
    expect(metaContent('meta[property="og:title"]')).toBe('草莓蛋糕 | LE Cake');
    expect(metaContent('meta[property="og:description"]')).toBe('當季草莓');
    expect(metaContent('meta[name="twitter:title"]')).toBe('草莓蛋糕 | LE Cake');
    expect(metaContent('meta[name="twitter:description"]')).toBe('當季草莓');

    // 再跑一次：既有 tag 被 update 而非重複建立
    updatePageMeta({ title: '巧克力蛋糕', description: '苦甜', siteName: 'LE Cake' });
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(metaContent('meta[name="description"]')).toBe('苦甜');
  });

  it('falls back to defaults.description and leaves description untouched when neither is given', () => {
    const existing = document.createElement('meta');
    existing.name = 'description';
    existing.content = '既有描述';
    document.head.appendChild(existing);

    updatePageMeta({ title: 'x', defaults: SITE_DEFAULTS });
    expect(metaContent('meta[name="description"]')).toBe(SITE_DEFAULTS.description);

    updatePageMeta({ title: 'x' });
    expect(metaContent('meta[name="description"]')).toBe(SITE_DEFAULTS.description); // 不清空、不動
  });

  it('builds canonical from siteUrl + path and syncs og:url / twitter:url', () => {
    updatePageMeta({ title: 'x', siteUrl: 'https://lecake.tw/', path: '/products/abc?from=line' });
    expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(
      'https://lecake.tw/products/abc?from=line',
    );
    expect(metaContent('meta[property="og:url"]')).toBe('https://lecake.tw/products/abc?from=line');
    expect(metaContent('meta[name="twitter:url"]')).toBe('https://lecake.tw/products/abc?from=line');
  });

  it('derives canonical from window.location when siteUrl/path omitted', () => {
    updatePageMeta({ title: 'x' });
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
    expect(canonical?.startsWith(window.location.origin)).toBe(true);
  });

  it('skips canonical when no window and no siteUrl (SSR-safe)', () => {
    vi.stubGlobal('window', undefined);
    updatePageMeta({ title: 'x', path: '/products/abc' });
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(metaContent('meta[property="og:url"]')).toBeNull();
  });

  it('absolutizes image with siteUrl and sets twitter:card', () => {
    updatePageMeta({ title: 'x', siteUrl: 'https://lecake.tw', image: '/og/cake.jpg' });
    expect(metaContent('meta[property="og:image"]')).toBe('https://lecake.tw/og/cake.jpg');
    expect(metaContent('meta[name="twitter:image"]')).toBe('https://lecake.tw/og/cake.jpg');
    expect(metaContent('meta[name="twitter:card"]')).toBe('summary_large_image');
  });

  it('keeps absolute image URLs verbatim and skips image when it cannot be absolutized', () => {
    updatePageMeta({ image: 'https://cdn.example.com/a.jpg' });
    expect(metaContent('meta[property="og:image"]')).toBe('https://cdn.example.com/a.jpg');

    document.head.innerHTML = ''; // 清掉上一段建立的 tag，確認第二段確實沒有新 tag
    vi.stubGlobal('window', undefined);
    updatePageMeta({ image: '/og/cake.jpg' });
    expect(metaContent('meta[property="og:image"]')).toBeNull();
  });

  it('returns a cleanup that restores title and description to defaults', () => {
    const restore = updatePageMeta({ title: '草莓蛋糕', description: '當季草莓', siteName: 'LE Cake', defaults: SITE_DEFAULTS });
    expect(document.title).toBe('草莓蛋糕 | LE Cake');
    restore();
    expect(document.title).toBe('LE Cake 蛋糕與客製甜點 | LE Cake');
    expect(metaContent('meta[name="description"]')).toBe(SITE_DEFAULTS.description);
  });

  it('cleanup is a no-op when no defaults are provided', () => {
    const restore = updatePageMeta({ title: '草莓蛋糕' });
    restore();
    expect(document.title).toBe('草莓蛋糕');
  });

  it('is a no-op without document (SSR)', () => {
    vi.stubGlobal('document', undefined);
    expect(() => updatePageMeta({ title: 'x' })).not.toThrow();
  });
});
