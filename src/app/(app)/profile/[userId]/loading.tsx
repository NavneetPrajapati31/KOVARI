export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <div className="w-full max-w-2xl bg-white/80 rounded-3xl shadow p-8 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
          {/* Profile Image Skeleton */}
          <div className="w-40 h-40 bg-gray-200 rounded-3xl mb-4 lg:mb-0" />
          {/* Info Skeleton */}
          <div className="flex-1 w-full space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="flex gap-2 mt-4">
              <div className="h-8 w-20 bg-gray-200 rounded" />
              <div className="h-8 w-28 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        {/* Stats Skeleton */}
        <div className="flex gap-8 mt-8">
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
