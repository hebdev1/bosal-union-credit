export default function RootLoading() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center"
      style={{ background: '#0C0C0E' }}
      aria-label="Chargement…"
      role="status"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Logo spinner */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: '#C41E3A', boxShadow: '0 0 24px rgba(196,30,58,0.30)' }}
          aria-hidden="true"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="animate-pulse"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
            <path
              d="M2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </svg>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Chargement…
        </p>
      </div>
    </div>
  )
}
