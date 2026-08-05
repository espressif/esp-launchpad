/**
 * Pre-load all assets from the assets directory for dynamic resolution
 * This enables Vite to bundle these assets and provide correct URLs
 */
const assetModules = import.meta.glob<string>("/src/assets/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

/**
 * Resolves an asset path from config to an actual URL
 * - Absolute URLs (https://...) are used as-is
 * - Relative paths are resolved from /src/assets/
 *
 * @param path - The path to resolve (can be absolute URL or relative path)
 * @returns The resolved URL that can be used in src attributes
 *
 * @example
 * // Absolute URL - returned as-is
 * resolveAssetPath("https://example.com/logo.png") // "https://example.com/logo.png"
 *
 * @example
 * // Relative paths - resolved from /src/assets/
 * resolveAssetPath("assets/img/logo.svg") // "/src/assets/img/logo.svg" (bundled)
 * resolveAssetPath("/assets/img/logo.svg") // "/src/assets/img/logo.svg" (bundled)
 * resolveAssetPath("img/logo.svg") // "/src/assets/img/logo.svg" (bundled)
 */
export function resolveAssetPath(path: string): string {
  // Absolute URL - use as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Normalize relative path: remove leading slash and 'src/' prefix if present
  let normalizedPath = path.replace(/^\/+/, "");
  normalizedPath = normalizedPath.replace(/^src\//, "");

  // Try different path variations
  const variations = [
    `/src/${normalizedPath}`,
    `/src/assets/${normalizedPath.replace(/^assets\//, "")}`,
  ];

  for (const variation of variations) {
    if (assetModules[variation]) {
      return assetModules[variation];
    }
  }

  // Fallback: return the original path (might work if it's in public folder)
  return path.startsWith("/") ? path : `/${path}`;
}
