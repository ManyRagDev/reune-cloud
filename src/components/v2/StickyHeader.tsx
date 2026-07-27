/**
 * StickyHeader - Header fixo com estilo neo-brutalista
 * Baseado no design das telas de novo_front/
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface StickyHeaderProps extends HTMLAttributes<HTMLElement> {
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
  showMarquee?: boolean;
  marqueeText?: string;
  variant?: 'default' | 'transparent';
}

export const StickyHeader = forwardRef<HTMLElement, StickyHeaderProps>(
  ({ 
    left,
    center,
    right,
    showMarquee = false,
    marqueeText = '',
    variant = 'default',
    className,
    ...props
  }, ref) => {
    const baseClasses = cn(
      'sticky top-0 z-50',
      variant === 'default' && 'bg-newsprint border-b-[3px] border-black',
      variant === 'transparent' && 'bg-transparent',
    );

    return (
      <header ref={ref} className={cn(baseClasses, className)} {...props}>
        {/* Main header row */}
        <div className="flex items-center justify-between px-4 py-3 h-[72px]">
          {/* Left section */}
          <div className="flex items-center flex-shrink-0 w-12">
            {left}
          </div>
          
          {/* Center section */}
          <div className="flex-1 flex items-center justify-center">
            {center}
          </div>
          
          {/* Right section */}
          <div className="flex items-center justify-end flex-shrink-0 w-12">
            {right}
          </div>
        </div>

        {/* Marquee banner */}
        {showMarquee && marqueeText && (
          <div className="w-full h-10 bg-black text-acid-lime flex items-center overflow-hidden border-b-[3px] border-black">
            <motion.div
              className="whitespace-nowrap flex items-center gap-8 font-mono font-bold text-sm tracking-widest px-4"
              animate={{ x: [0, -1000] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 20,
                  ease: "linear",
                },
              }}
            >
              {/* Duplicate text for seamless loop */}
              {[...Array(4)].map((_, i) => (
                <span key={i} className="flex items-center gap-8">
                  <span>{marqueeText}</span>
                  <span className="text-white">{'//'}</span>
                  <span>{marqueeText}</span>
                  <span className="text-white">{'//'}</span>
                </span>
              ))}
            </motion.div>
          </div>
        )}
      </header>
    );
  }
);

StickyHeader.displayName = 'StickyHeader';

export default StickyHeader;
