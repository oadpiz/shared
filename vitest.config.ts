import { defineConfig } from 'vitest/config';

// 預設 node 環境（priceDisplay / lineOrder 純函式）；
// 需要 DOM 的 pageMeta 與框架薄殼測試在個別檔案以 @vitest-environment jsdom docblock 宣告。
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    environment: 'node',
  },
});
