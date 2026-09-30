/** The mark: a candle that reaches the line. The line is red. */
export function Mark({ size = 18, hot = false }: { size?: number; hot?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      aria-hidden
      focusable="false"
    >
      <rect x="0.5" y="0.5" width="17" height="17" fill="#000" stroke="#333" />
      <line x1="2" y1="4.5" x2="16" y2="4.5" stroke="#ff3b3b" strokeDasharray="2 1.5" />
      <line x1="9" y1="3" x2="9" y2="16" stroke={hot ? "#ff3b3b" : "#00d26a"} />
      <rect x="6.5" y="6" width="5" height="8" fill={hot ? "#ff3b3b" : "#00d26a"} />
    </svg>
  );
}
