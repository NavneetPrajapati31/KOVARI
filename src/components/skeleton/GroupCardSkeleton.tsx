export default function GroupCardSkeleton() {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {/* Header image skeleton */}
        <div className="h-48 bg-gray-200 animate-pulse"></div>
  
        <div className="p-6">
          {/* Title and subtitle skeleton */}
          <div className="mb-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-4/5 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/5"></div>
          </div>
  
          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
  
          {/* Group details skeleton */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-20 mb-1"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-14 mb-1"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-10"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-18 mb-1"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-14"></div>
            </div>
          </div>
  
          {/* Members avatars skeleton */}
          <div className="mb-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse border-2 border-white"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse border-2 border-white"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse border-2 border-white"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse border-2 border-white flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
  
          {/* Tags skeleton */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="h-6 bg-gray-200 rounded-full animate-pulse w-18"></div>
            <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
          </div>
  
          {/* Footer with price and button skeleton */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-12 mb-1"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
        </div>
      </div>
    )
  }
  