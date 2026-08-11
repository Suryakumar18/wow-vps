import { PageHeaderSkeleton, TabsSkeleton, FormCardSkeleton, TableSkeleton } from "../Skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <TabsSkeleton count={2} />
      <div className="flex flex-col gap-6">
        <FormCardSkeleton fields={3} />
        <TableSkeleton rows={3} columns={4} />
      </div>
    </div>
  );
}
