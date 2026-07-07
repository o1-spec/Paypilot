import React from 'react';

interface LoadingSkeletonProps {
  type: 'card-grid' | 'table' | 'list';
}

// Shimmer class: subtle warm-toned off-white skeleton matching Nomba/PayPilot theme
const SHIMMER =
  'bg-[#F0EDE8] rounded';

export default function LoadingSkeleton({ type }: LoadingSkeletonProps) {
  if (type === 'card-grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="rounded-2xl border border-[#E5E2DC] bg-white p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className={`h-3 w-24 ${SHIMMER}`} />
              <div className={`h-8 w-8 ${SHIMMER}`} />
            </div>
            <div className="space-y-2">
              <div className={`h-6 w-32 ${SHIMMER}`} />
              <div className={`h-3 w-40 ${SHIMMER}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="rounded-2xl border border-[#E5E2DC] bg-white p-6 shadow-sm animate-pulse space-y-5">
        <div className="flex justify-between items-center border-b border-[#E5E2DC] pb-4">
          <div className={`h-4 w-40 ${SHIMMER}`} />
          <div className={`h-8 w-32 ${SHIMMER}`} />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex justify-between items-center py-2">
              <div className="flex gap-4">
                <div className={`h-9 w-9 rounded-full ${SHIMMER}`} />
                <div className="space-y-2">
                  <div className={`h-3 w-28 ${SHIMMER}`} />
                  <div className={`h-2.5 w-20 ${SHIMMER}`} />
                </div>
              </div>
              <div className={`h-3.5 w-20 ${SHIMMER}`} />
              <div className={`h-3 w-16 ${SHIMMER}`} />
              <div className={`h-3 w-24 ${SHIMMER}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // list
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="p-4 bg-white rounded-2xl border border-[#E5E2DC] space-y-2">
          <div className="flex justify-between items-center">
            <div className={`h-3.5 w-32 ${SHIMMER}`} />
            <div className={`h-2.5 w-16 ${SHIMMER}`} />
          </div>
          <div className={`h-2.5 w-full ${SHIMMER}`} />
          <div className={`h-2.5 w-2/3 ${SHIMMER}`} />
        </div>
      ))}
    </div>
  );
}
