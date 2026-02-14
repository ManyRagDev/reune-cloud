import React from 'react';
import { Button } from '@/components/ui/button';

interface InsightCardProps {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  backgroundColor?: string;
}

export function InsightCard({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  backgroundColor = 'from-purple-100 to-pink-100',
}: InsightCardProps) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${backgroundColor} p-6 border border-white/50 shadow-lg hover:shadow-xl transition-shadow duration-300`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{emoji}</div>
        <div className="flex-1">
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-700 mb-3">{description}</p>
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="bg-white text-gray-900 hover:bg-gray-100 text-sm h-8"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
