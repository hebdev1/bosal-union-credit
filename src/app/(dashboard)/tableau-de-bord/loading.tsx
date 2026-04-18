export default function DashboardLoading() {
  return (
    <div className="px-6 py-6 space-y-8 max-w-[1280px] mx-auto w-full" aria-label="Chargement…" role="status">
      {/* Header skeleton */}
      <div className="space-y-1">
        <div className="h-5 w-36 rounded skeleton" />
        <div className="h-3 w-56 rounded skeleton mt-1" />
      </div>

      {/* KPI grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 space-y-4"
            style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <div className="w-9 h-9 rounded-lg skeleton" />
            <div className="space-y-2">
              <div className="h-6 w-28 rounded skeleton" />
              <div className="h-3 w-20 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* Lower grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div
          className="lg:col-span-3 rounded-xl"
          style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', height: 360 }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="h-4 w-40 rounded skeleton" />
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-lg skeleton flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded skeleton" />
                  <div className="h-2.5 w-20 rounded skeleton" />
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-3.5 w-20 rounded skeleton" />
                  <div className="h-2.5 w-12 rounded skeleton ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="lg:col-span-2 rounded-xl"
          style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', height: 360 }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="h-4 w-28 rounded skeleton" />
          </div>
          <div className="flex items-center justify-center h-48">
            <div className="h-3 w-40 rounded skeleton" />
          </div>
        </div>
      </div>
    </div>
  )
}
