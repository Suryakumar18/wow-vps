import { PageHeaderSkeleton, FormCardSkeleton } from "../../Skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <FormCardSkeleton fields={6} />
        <FormCardSkeleton fields={4} />
        <FormCardSkeleton fields={2} />
        <FormCardSkeleton fields={4} />
      </div>
    </div>
  );
}
