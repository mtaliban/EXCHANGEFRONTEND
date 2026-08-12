/** Skeleton ya haraka wakati wa navigation (client-side) — hakuna blank flash. */
export default function Loading() {
  return (
    <div className="p-4 md:p-6 space-y-4 animate-pulse">
      <div className="h-28 rounded-2xl bg-brand-grey-100 dark:bg-brand-grey-800" />
      <div className="h-10 rounded-xl bg-brand-grey-100 dark:bg-brand-grey-800 w-2/3" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 rounded-xl bg-brand-grey-100 dark:bg-brand-grey-800" />
        ))}
      </div>
    </div>
  );
}
