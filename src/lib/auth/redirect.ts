/**
 * Post-login / post-callback redirect target.
 *
 * Only same-origin absolute paths are accepted: "//evil.com", "/\evil.com"
 * and "https://evil.com" would otherwise send a freshly signed-in user to
 * another site (open redirect).
 */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = '/tableau-de-bord',
): string {
  if (!value) return fallback
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  // Control characters (tab, newline…) are stripped by URL parsers and can
  // turn "/\t/evil.com" into "//evil.com".
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (c < 0x20 || c === 0x7f) return fallback
  }
  return value
}
