import { cn } from "@/lib/utils";

export function SkeletonLine({
  className,
  width = "w-full",
  height = "h-3",
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={cn("skeleton", height, width, className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({
  className,
  header = true,
  lines = 3,
}: {
  className?: string;
  header?: boolean;
  lines?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/50 p-4 space-y-3",
        className,
      )}
      aria-hidden="true"
    >
      {header && (
        <div className="flex items-center gap-3">
          <SkeletonLine width="w-8 h-8 rounded-lg" height="h-8" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="w-3/4" />
            <SkeletonLine width="w-1/2" height="h-2" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? "w-2/3" : "w-full"} />
      ))}
    </div>
  );
}

export function SkeletonGrid({
  count = 3,
  className,
  cols = "md:grid-cols-2 xl:grid-cols-3",
}: {
  count?: number;
  className?: string;
  cols?: string;
}) {
  return (
    <div className={cn("grid gap-4", cols, className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton({
  lines = 6,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)} aria-label="Loading">
      {/* Header bar skeleton */}
      <div className="flex items-center gap-3">
        <SkeletonLine width="w-32 h-5" height="h-5" />
        <SkeletonLine width="w-16 h-5" height="h-5" />
      </div>
      {/* Stats row skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card/50 p-4 space-y-2"
          >
            <SkeletonLine width="w-16 h-2" height="h-2" />
            <SkeletonLine width="w-24 h-6" height="h-6" />
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonCard lines={lines} />
        <SkeletonCard lines={lines} />
      </div>
    </div>
  );
}

export function SkeletonList({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card/50"
        >
          <SkeletonLine width="w-8 h-8 rounded-lg" height="h-8" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="w-3/4" />
            <SkeletonLine width="w-1/2" height="h-2" />
          </div>
          <SkeletonLine width="w-16 h-6" height="h-6" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({
  fields = 6,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)} aria-hidden="true">
      <div className="flex items-center gap-3">
        <SkeletonLine width="w-8 h-8 rounded-lg" height="h-8" />
        <SkeletonLine width="w-40 h-5" height="h-5" />
      </div>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2 px-4 py-3">
          <SkeletonLine width="w-24 h-2" height="h-2" />
          <SkeletonLine width="w-full h-8" height="h-8" />
        </div>
      ))}
    </div>
  );
}
