import { minify } from "https://cdn.jsdelivr.net/npm/terser@5/+esm";

/**
 * Convert a function to a bookmarklet
 *
 * @param {Function} func - The function to convert to a bookmarklet
 * @returns {string} - The bookmarklet code (e.g. "javascript:(function(){...})()")
 */
export async function bookmarklet(func) {
  let funcBody = func
    .toString()
    // Remove the function declaration and curly braces
    .replace(/^[^{]+{|}$/g, "")
    // We use [ORIGIN] to indicate this app's server. Replace it so it works on DEV and PROD
    .replace(/\[ORIGIN\]/g, window.location.origin);
  // Minify for compactness
  let minified = (await minify(funcBody.trim())).code;
  return `javascript:(function(){${minified}})();`;
}
