// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { usePageMeta } from '../src/vue';

const SITE_DEFAULTS = {
  title: '台中國農宮 - 神農大帝線上結緣所',
  description: '台中國農宮線上結緣所，總斗首、平安斗首、安斗安燈、制化祭改。',
};

afterEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

describe('usePageMeta（Vue composable 薄殼）', () => {
  it('applies meta immediately and re-applies when reactive meta changes', async () => {
    const meta = ref({ title: '總斗首', siteName: '台中國農宮', defaults: SITE_DEFAULTS });
    const scope = effectScope();
    scope.run(() => usePageMeta(meta));

    expect(document.title).toBe('總斗首 | 台中國農宮');

    meta.value = { ...meta.value, title: '平安斗首' };
    await nextTick();
    expect(document.title).toBe('平安斗首 | 台中國農宮');

    scope.stop();
  });

  it('restores defaults when the scope is disposed（元件卸載）', () => {
    const scope = effectScope();
    scope.run(() => usePageMeta({ title: '安斗安燈', siteName: '台中國農宮', defaults: SITE_DEFAULTS }));
    expect(document.title).toBe('安斗安燈 | 台中國農宮');

    scope.stop();
    expect(document.title).toBe('台中國農宮 - 神農大帝線上結緣所');
    expect(document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content).toBe(
      SITE_DEFAULTS.description,
    );
  });
});
