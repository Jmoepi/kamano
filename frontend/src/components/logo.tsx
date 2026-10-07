/** Kamano mark: a framed "K", in the same outline style as the reference. */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 34" className={className} aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="32" height="32" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 9v16M11 18.5 23 9M15.2 15.4 23 25" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
