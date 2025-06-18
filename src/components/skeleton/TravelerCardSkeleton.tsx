export default function TravelerCardSkeleton() {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        {/* Avatar and basic info section */}
        <div className="flex items-center space-x-4 mb-4">
          {/* Avatar skeleton */}
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
  
          {/* Name and location skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
  
        {/* Bio section skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
        </div>
  
        {/* Tags section skeleton */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-14"></div>
        </div>
  
        {/* Stats section skeleton */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4">
            <div className="text-center">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-8 mx-auto mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
            <div className="text-center">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-8 mx-auto mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
          </div>
  
          {/* Rating skeleton */}
          <div className="flex items-center space-x-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
          </div>
        </div>
  
        {/* Action buttons skeleton */}
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 rounded animate-pulse flex-1"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-20"></div>
        </div>
      </div>
    )
  }
  