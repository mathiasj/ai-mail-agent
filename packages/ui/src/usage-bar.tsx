import React from 'react';

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
}

export function UsageBar({ label, used, limit }: UsageBarProps) {
  const isUnlimited = limit > 99999;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = pct > 80;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {used} / {isUnlimited ? 'Unlimited' : limit.toLocaleString()}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? 'bg-red-500' : 'bg-brand-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
