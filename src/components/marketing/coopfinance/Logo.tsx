/** CoopFinance wordmark (Figma Make design "Design Financial SaaS Platform"). */
export function CoopFinanceLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo">
      <span className="logo-mark" aria-hidden="true">
        <span />
      </span>
      {!compact && (
        <span>
          Coop<span>Finance</span>
        </span>
      )}
    </span>
  )
}
