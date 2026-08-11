import { PageHeaderSkeleton, FormCardSkeleton } from "../Skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction={false} />
      <div className="flex flex-col gap-8">
        <FormCardSkeleton fields={10} />
        <FormCardSkeleton fields={4} />
      </div>
    </div>
  );
}
