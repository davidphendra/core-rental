export default function Loading() {
  return (
    <div aria-hidden="true" className="bg-background flex min-h-screen items-center justify-center">
      <div className="bg-primary/20 h-12 w-12 animate-pulse rounded-full" />
    </div>
  );
}
