import React from 'react';

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-[#E2E8F0] rounded animate-pulse"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-[#E2E8F0] rounded-xl animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#E2E8F0] rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-[#E2E8F0] rounded w-1/2 animate-pulse" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
          <div className="h-3 bg-[#E2E8F0] rounded w-20 mb-3 animate-pulse" />
          <div className="h-8 bg-[#E2E8F0] rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonSkillRow({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E2E8F0]">
          <div className="w-10 h-10 bg-[#E2E8F0] rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#E2E8F0] rounded w-32 animate-pulse" />
            <div className="h-3 bg-[#E2E8F0] rounded w-full animate-pulse" />
          </div>
          <div className="h-6 bg-[#E2E8F0] rounded w-20 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function SkeletonLoader({ type = 'card', ...props }) {
  switch (type) {
    case 'text':
      return <SkeletonText {...props} />;
    case 'card':
      return <SkeletonCard {...props} />;
    case 'stats':
      return <SkeletonStats {...props} />;
    case 'skill-row':
      return <SkeletonSkillRow {...props} />;
    default:
      return <SkeletonCard {...props} />;
  }
}