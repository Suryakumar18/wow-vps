import { PageHeaderSkeleton, TableSkeleton } from "../Skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton rows={7} columns={6} />
    </div>
  );
}
