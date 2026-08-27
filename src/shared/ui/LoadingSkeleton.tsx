/** Brand-styled skeleton primitive (matches the root loading.tsx aesthetic, #29). */
export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface-container-high animate-pulse rounded-xl ${className}`}
    />
  );
}
