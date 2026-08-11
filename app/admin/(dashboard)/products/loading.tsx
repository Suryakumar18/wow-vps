import { PageHeaderSkeleton, TableSkeleton, Shimmer } from "../Skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        {Array.from({ length: 4 }, (_, i) => (
          <Shimmer key={i} className="h-11 w-full rounded-lg md:w-40" />
        ))}
      </div>
      <TableSkeleton rows={8} columns={7} />
    </div>
  );
}
