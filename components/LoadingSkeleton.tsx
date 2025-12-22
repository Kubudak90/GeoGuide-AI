import React from 'react';

interface LoadingSkeletonProps {
  type?: 'message' | 'place' | 'card' | 'text';
  count?: number;
}

/**
 * Loading skeleton component for better UX during data fetching
 */
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'text', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'message':
        return (
          <div className="flex w-full mb-6 justify-start animate-pulse">
            <div className="flex max-w-[90%] md:max-w-[80%]">
              {/* Avatar skeleton */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 mt-1" />

              {/* Message content skeleton */}
              <div className="flex flex-col p-4 rounded-2xl bg-gray-100 border border-gray-200 min-w-[200px]">
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                <div className="h-4 bg-gray-200 rounded mb-2 w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        );

      case 'place':
        return (
          <div className="animate-pulse flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-3 shadow-sm w-full max-w-xs">
            {/* Icon skeleton */}
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />

            {/* Content skeleton */}
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>

            {/* Arrow skeleton */}
            <div className="w-4 h-4 bg-gray-200 rounded" />
          </div>
        );

      case 'card':
        return (
          <div className="animate-pulse bg-white rounded-2xl shadow-xl overflow-hidden max-w-sm">
            {/* Image skeleton */}
            <div className="h-40 bg-gray-200" />

            {/* Content skeleton */}
            <div className="p-5">
              <div className="h-6 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-4 bg-gray-200 rounded mb-2 w-full" />
              <div className="h-4 bg-gray-200 rounded mb-4 w-5/6" />

              {/* Rating skeleton */}
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>

              {/* Buttons skeleton */}
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-gray-200 rounded-lg col-span-2" />
                <div className="h-9 bg-gray-200 rounded-lg" />
                <div className="h-9 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>
        );

      case 'text':
      default:
        return (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          </div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default LoadingSkeleton;
