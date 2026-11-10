import {
  updatePageMeta
} from "./chunk-LQEQZCXG.js";

// src/vue.ts
import { toValue, watchEffect } from "vue";
function usePageMeta(meta) {
  watchEffect((onCleanup) => {
    onCleanup(updatePageMeta(toValue(meta)));
  });
}
export {
  usePageMeta
};
//# sourceMappingURL=vue.js.map