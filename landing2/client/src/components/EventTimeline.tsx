import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  eventCount: number;
  emoji: string;
  hasEvents: boolean;
}

interface EventTimelineProps {
  days: TimelineDay[];
  onDaySelect: (date: Date) => void;
  selectedDate?: Date;
}

export function EventTimeline({ days, onDaySelect, selectedDate }: EventTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  React.useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    return () => container?.removeEventListener('scroll', checkScroll);
  }, []);

  return (
    <div className="relative bg-white border-b border-gray-100 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Timeline container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto scrollbar-hide flex gap-3"
            style={{ scrollBehavior: 'smooth' }}
          >
            {days.map((day) => {
              const isSelected = selectedDate?.toDateString() === day.date.toDateString();
              return (
                <button
                  key={day.date.toISOString()}
                  onClick={() => onDaySelect(day.date)}
                  className={`flex-shrink-0 w-20 h-24 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-gradient-to-br from-orange-400 to-pink-400 shadow-lg scale-105'
                      : day.hasEvents
                        ? 'bg-white border-2 border-gray-200 hover:border-orange-300'
                        : 'bg-gray-50 border-2 border-gray-100 opacity-50'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-600">{day.dayName}</div>
                  <div className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                    {day.dayNumber}
                  </div>
                  {day.hasEvents && (
                    <>
                      <div className="text-xl">{day.emoji}</div>
                      <div
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-white' : 'text-orange-600'
                        }`}
                      >
                        {day.eventCount}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
