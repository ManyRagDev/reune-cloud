import React, { useState } from 'react';
import { MapPin, Clock, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Event {
  id: string;
  title: string;
  emoji: string;
  image: string;
  location: string;
  time: string;
  confirmedCount: number;
  totalCount: number;
  completedItems: number;
  totalItems: number;
  status: 'happening' | 'upcoming' | 'past';
  daysUntil?: number;
  pendingItems?: number;
}

interface EventCardProps {
  event: Event;
  size?: 'large' | 'medium' | 'small';
  onViewDetails: (event: Event) => void;
  onOpenChat: (event: Event) => void;
}

export function EventCard({
  event,
  size = 'large',
  onViewDetails,
  onOpenChat,
}: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const progressPercentage = (event.completedItems / event.totalItems) * 100;
  const isComplete = event.completedItems === event.totalItems;

  const sizeClasses = {
    large: 'h-96',
    medium: 'h-72',
    small: 'h-48',
  };

  const imageHeightClasses = {
    large: 'h-48',
    medium: 'h-32',
    small: 'h-24',
  };

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden bg-white transition-all duration-300 ${
        isHovered ? 'shadow-2xl scale-[1.02]' : 'shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image with parallax effect */}
      <div className={`relative ${imageHeightClasses[size]} overflow-hidden`}>
        <img
          src={event.image}
          alt={event.title}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

        {/* Emoji badge */}
        <div className="absolute top-3 left-3 text-3xl bg-white/90 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
          {event.emoji}
        </div>

        {/* Status badge */}
        {isComplete && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Pronto
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-4 ${size === 'small' ? 'space-y-2' : 'space-y-3'}`}>
        {/* Title */}
        <h3 className="font-heading text-lg font-bold text-gray-900 line-clamp-2">
          {event.title}
        </h3>

        {/* Location and Time */}
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>{event.time}</span>
            {event.daysUntil !== undefined && event.daysUntil > 0 && (
              <span className="text-xs text-gray-500">• Faltam {event.daysUntil} dias</span>
            )}
          </div>
        </div>

        {/* Progress section - only for large and medium */}
        {size !== 'small' && (
          <div className="space-y-2 pt-2">
            {/* Items status */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-700">
                {isComplete ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-semibold">✅ {event.completedItems}/{event.totalItems} itens confirmados</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold">⚠️ {event.pendingItems || event.totalItems - event.completedItems} itens pendentes</span>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isComplete ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-orange-400 to-pink-400'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* People count */}
            <div className="flex items-center gap-1 text-gray-700 text-xs font-semibold">
              <Users className="w-4 h-4 text-orange-500" />
              👥 {event.confirmedCount} confirmados
            </div>
          </div>
        )}

        {/* People count - for small cards */}
        {size === 'small' && (
          <div className="flex items-center gap-1 text-gray-700 text-xs font-semibold">
            <Users className="w-3 h-3 text-orange-500" />
            👥 {event.confirmedCount}
          </div>
        )}

        {/* Buttons - only for large and medium */}
        {size !== 'small' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onViewDetails(event)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm h-9"
            >
              Ver detalhes
            </Button>
            <Button
              onClick={() => onOpenChat(event)}
              variant="outline"
              className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 text-sm h-9"
            >
              Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
