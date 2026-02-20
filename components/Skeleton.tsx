import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

export const PlaceChipSkeleton: React.FC = () => (
  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 w-full max-w-xs">
    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
    </div>
  </div>
);

export const MessageSkeleton: React.FC = () => (
  <div className="flex w-full mb-6 justify-start">
    <div className="flex max-w-[80%] flex-row">
      <Skeleton className="w-8 h-8 rounded-full mr-3 flex-shrink-0" />
      <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-64">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    </div>
  </div>
);

export default Skeleton;
