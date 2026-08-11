import { PageHeaderSkeleton, TabsSkeleton, FormCardSkeleton } from "../Skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <TabsSkeleton />
      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <FormCardSkeleton fields={8} />
        <FormCardSkeleton fields={6} />
      </div>
    </div>
  );
}
