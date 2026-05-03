// ═══════════════════════════════════════════
// SudoX — Global Loading State
// Shown during route transitions (Suspense boundary).
// ═══════════════════════════════════════════

export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
      }}
    >
      <div className="loading-spinner" />
    </div>
  );
}
