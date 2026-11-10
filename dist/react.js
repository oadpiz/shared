import {
  updatePageMeta
} from "./chunk-LQEQZCXG.js";

// src/react.ts
import { useEffect } from "react";
function usePageMeta(meta) {
  const { title, description, path, image, siteUrl, siteName, defaults } = meta;
  useEffect(
    () => updatePageMeta({ title, description, path, image, siteUrl, siteName, defaults }),
    [title, description, path, image, siteUrl, siteName, defaults]
  );
}
export {
  usePageMeta
};
//# sourceMappingURL=react.js.map