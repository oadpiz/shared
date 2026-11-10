"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/react.ts
var react_exports = {};
__export(react_exports, {
  usePageMeta: () => usePageMeta
});
module.exports = __toCommonJS(react_exports);
var import_react = require("react");

// src/pageMeta.ts
function upsertMeta(selector, attr, key, content) {
  let meta = document.querySelector(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
}
function upsertCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}
function resolveAbsoluteUrl(origin, pathOrUrl) {
  if (pathOrUrl == null) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!origin) return "";
  return `${origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}
function updatePageMeta(meta) {
  if (typeof document === "undefined") return () => void 0;
  const pageTitle = meta.title?.trim() ?? "";
  const fullTitle = pageTitle ? meta.siteName ? `${pageTitle} | ${meta.siteName}` : pageTitle : meta.defaults?.title ?? meta.siteName ?? "";
  const origin = meta.siteUrl?.replace(/\/+$/, "") || (typeof window !== "undefined" ? window.location.origin : "");
  let path = meta.path;
  if (path == null && typeof window !== "undefined") {
    path = `${window.location.pathname}${window.location.search}`;
  }
  const canonical = resolveAbsoluteUrl(origin, path);
  const image = resolveAbsoluteUrl(origin, meta.image);
  if (fullTitle) document.title = fullTitle;
  const description = meta.description?.trim() || meta.defaults?.description || "";
  if (description) {
    upsertMeta('meta[name="description"]', "name", "description", description);
  }
  if (fullTitle) {
    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
  }
  if (description) {
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
  }
  if (canonical) {
    upsertCanonical(canonical);
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonical);
    upsertMeta('meta[name="twitter:url"]', "name", "twitter:url", canonical);
  }
  if (image) {
    upsertMeta('meta[property="og:image"]', "property", "og:image", image);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  }
  const defaults = meta.defaults;
  return () => {
    if (!defaults) return;
    if (defaults.title) document.title = defaults.title;
    if (defaults.description) {
      upsertMeta('meta[name="description"]', "name", "description", defaults.description);
    }
  };
}

// src/react.ts
function usePageMeta(meta) {
  const { title, description, path, image, siteUrl, siteName, defaults } = meta;
  (0, import_react.useEffect)(
    () => updatePageMeta({ title, description, path, image, siteUrl, siteName, defaults }),
    [title, description, path, image, siteUrl, siteName, defaults]
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  usePageMeta
});
//# sourceMappingURL=react.cjs.map