export interface GrowthRingsProps {
  className?: string;
}

const RINGS = [
  { r: 34, dx: 0, dy: 0 },
  { r: 70, dx: 3, dy: -2 },
  { r: 108, dx: 6, dy: -3 },
  { r: 150, dx: 8, dy: -6 },
  { r: 194, dx: 11, dy: -8 },
] as const;

/**
 * Tree rings, drawn slightly off-centre the way real ones grow. The one
 * decorative motif in the product: it sits behind hero panels and sign-in,
 * standing for development measured over seasons rather than in marks.
 * Colour comes from `currentColor`.
 */
export function GrowthRings({ className }: GrowthRingsProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 420 420" fill="none" className={className}>
      {RINGS.map((ring, index) => (
        <circle
          key={ring.r}
          cx={210 + ring.dx}
          cy={210 + ring.dy}
          r={ring.r}
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={1 - index * 0.15}
        />
      ))}
      <circle cx="210" cy="210" r="10" fill="currentColor" />
    </svg>
  );
}
