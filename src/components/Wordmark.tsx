import { WORDMARK_PATHS } from './wordmarkPaths'

/** The pixel "SHARC" lettering lifted straight out of the club logo. */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="237 149 305 78"
      fill="currentColor"
      role="img"
      aria-label="SHARC"
    >
      {WORDMARK_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  )
}
