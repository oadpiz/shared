// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageMeta } from '../src/react';

const SITE_DEFAULTS = {
  title: 'LE Cake 蛋糕與客製甜點 | LE Cake',
  description: 'LE Cake 提供客製化生日蛋糕、派對甜點、節慶禮盒與預訂取貨服務。',
};

function metaContent(selector: string): string | null {
  return document.querySelector<HTMLMetaElement>(selector)?.content ?? null;
}

afterEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

describe('usePageMeta（React 薄殼）', () => {
  it('applies meta on mount and updates on rerender', () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) =>
        usePageMeta({ title, siteName: 'LE Cake', description: '當季甜點', defaults: SITE_DEFAULTS }),
      { initialProps: { title: '草莓蛋糕' } },
    );
    expect(document.title).toBe('草莓蛋糕 | LE Cake');
    expect(metaContent('meta[property="og:title"]')).toBe('草莓蛋糕 | LE Cake');

    rerender({ title: '巧克力蛋糕' });
    expect(document.title).toBe('巧克力蛋糕 | LE Cake');
  });

  it('restores defaults on unmount（lecake usePageMeta 行為）', () => {
    const { unmount } = renderHook(() =>
      usePageMeta({ title: '草莓蛋糕', description: '當季草莓', siteName: 'LE Cake', defaults: SITE_DEFAULTS }),
    );
    expect(document.title).toBe('草莓蛋糕 | LE Cake');
    unmount();
    expect(document.title).toBe('LE Cake 蛋糕與客製甜點 | LE Cake');
    expect(metaContent('meta[name="description"]')).toBe(SITE_DEFAULTS.description);
  });
});
