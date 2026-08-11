import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "./Skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <StatCardsSkeleton />
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <TableSkeleton rows={4} columns={4} />
        <TableSkeleton rows={4} columns={3} />
      </div>
    </div>
  );
}
