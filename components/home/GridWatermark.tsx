// Faint watermark 9x9 grid icon positioned inside the right side of cards.
// aria-hidden — visual balance element with subtle warm tint for light-mode glassmorphism.

export function GridWatermark({
  pattern = 'standard',
}: {
  pattern?: 'standard' | 'x' | 'windows' | 'dozaku';
}) {
  if (pattern === 'dozaku') {
    return (
      <svg
        className="absolute right-3.5 bottom-3.5 md:right-5 md:bottom-5 w-24 h-24 md:w-28 md:h-28 text-stone-900/[0.06] group-hover:text-stone-900/[0.10] group-hover:scale-105 transition-all duration-300 pointer-events-none select-none"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* 12x12 fine grid lines */}
        {[8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88].map((pos) => {
          const isMajor = pos % 24 === 0 || pos % 32 === 0;
          return (
            <g key={pos}>
              <line
                x1={pos}
                y1={0}
                x2={pos}
                y2={96}
                stroke="currentColor"
                strokeWidth={isMajor ? 1.4 : 0.5}
                strokeOpacity={isMajor ? 0.85 : 0.35}
              />
              <line
                x1={0}
                y1={pos}
                x2={96}
                y2={pos}
                stroke="currentColor"
                strokeWidth={isMajor ? 1.4 : 0.5}
                strokeOpacity={isMajor ? 0.85 : 0.35}
              />
            </g>
          );
        })}
        {/* Outer border */}
        <rect
          x="0.75"
          y="0.75"
          width="94.5"
          height="94.5"
          stroke="currentColor"
          strokeWidth="1.5"
          rx="2"
        />
        {/* Alternating 3x4 block highlights for Dozaku layout */}
        <rect x="0" y="0" width="32" height="24" fill="currentColor" fillOpacity="0.08" />
        <rect x="64" y="0" width="32" height="24" fill="currentColor" fillOpacity="0.08" />
        <rect x="32" y="24" width="32" height="24" fill="currentColor" fillOpacity="0.08" />
        <rect x="0" y="48" width="32" height="24" fill="currentColor" fillOpacity="0.08" />
        <rect x="64" y="48" width="32" height="24" fill="currentColor" fillOpacity="0.08" />
        <rect x="32" y="72" width="32" height="24" fill="currentColor" fillOpacity="0.08" />
      </svg>
    );
  }

  return (
    <svg
      className="absolute right-3.5 bottom-3.5 md:right-5 md:bottom-5 w-24 h-24 md:w-28 md:h-28 text-stone-900/[0.06] group-hover:text-stone-900/[0.10] group-hover:scale-105 transition-all duration-300 pointer-events-none select-none"
      viewBox="0 0 90 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* 9x9 fine grid lines */}
      {[10, 20, 30, 40, 50, 60, 70, 80].map((pos) => (
        <g key={pos}>
          <line
            x1={pos}
            y1={0}
            x2={pos}
            y2={90}
            stroke="currentColor"
            strokeWidth={pos % 30 === 0 ? 1.5 : 0.6}
            strokeOpacity={pos % 30 === 0 ? 0.85 : 0.4}
          />
          <line
            x1={0}
            y1={pos}
            x2={90}
            y2={pos}
            stroke="currentColor"
            strokeWidth={pos % 30 === 0 ? 1.5 : 0.6}
            strokeOpacity={pos % 30 === 0 ? 0.85 : 0.4}
          />
        </g>
      ))}
      {/* Outer border */}
      <rect
        x="0.75"
        y="0.75"
        width="88.5"
        height="88.5"
        stroke="currentColor"
        strokeWidth="1.5"
        rx="2"
      />
      {pattern === 'x' && (
        <>
          <line x1="0" y1="0" x2="90" y2="90" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2" />
          <line x1="90" y1="0" x2="0" y2="90" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2" />
        </>
      )}
      {pattern === 'windows' && (
        <>
          <rect x="10" y="10" width="30" height="30" fill="currentColor" fillOpacity="0.12" />
          <rect x="50" y="10" width="30" height="30" fill="currentColor" fillOpacity="0.12" />
          <rect x="10" y="50" width="30" height="30" fill="currentColor" fillOpacity="0.12" />
          <rect x="50" y="50" width="30" height="30" fill="currentColor" fillOpacity="0.12" />
        </>
      )}
    </svg>
  );
}
