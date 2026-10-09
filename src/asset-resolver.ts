/**
 * Pre-load all project assets for dynamic resolution.
 * This enables Vite to bundle these assets and provide correct URLs
 */
const assetModules = import.meta.glob<string>("/assets/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

/**
 * Resolves an asset path from config to an actual URL
 * - Absolute URLs (https://...) are used as-is
 * - Relative paths are resolved from the project-level /assets/ directory
 *
 * @param path - The path to resolve (can be absolute URL or relative path)
 * @returns The resolved URL that can be used in src attributes
 *
 * @example
 * // Absolute URL - returned as-is
 * resolveAssetPath("https://example.com/logo.png") // "https://example.com/logo.png"
 *
 * @example
 * // Relative paths - resolved from /assets/
 * resolveAssetPath("assets/img/logo.svg") // bundled asset URL
 * resolveAssetPath("/assets/img/logo.svg") // bundled asset URL
 * resolveAssetPath("img/logo.svg") // bundled asset URL
 */
export function resolveAssetPath(path: string): string {
  // Absolute URL - use as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Normalize relative path: remove leading slash and src or assets prefixes.
  let normalizedPath = path.replace(/^\/+/, "");
  normalizedPath = normalizedPath.replace(/^src\//, "");
  normalizedPath = normalizedPath.replace(/^assets\//, "");

  const assetPath = `/assets/${normalizedPath}`;
  if (assetModules[assetPath]) {
    return assetModules[assetPath];
  }

  // Preserve Vite's deployment base for unbundled public assets.
  return `${import.meta.env.BASE_URL}assets/${normalizedPath}`;
}
