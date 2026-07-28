/**
 * BrutalistCard - Card com estilo neo-brutalista
 * Baseado no design das telas de novo_front/
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface BrutalistCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'dark' | 'dashed';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  isInteractive?: boolean;
  noShadow?: boolean;
}

export const BrutalistCard = forwardRef<HTMLDivElement, BrutalistCardProps>(
  ({ 
    children,
    variant = 'default',
    padding = 'md',
    isInteractive = false,
    noShadow = false,
    className,
    onClick,
    ...props
  }, ref) => {
    const baseClasses = cn(
      // Base styles
      'relative overflow-hidden',
      'border-[3px] border-black',
      // Padding
      padding === 'none' && 'p-0',
      padding === 'sm' && 'p-3',
      padding === 'md' && 'p-4',
      padding === 'lg' && 'p-6',
    );

    const variantClasses = {
      default: 'bg-white',
      primary: 'bg-acid-lime',
      secondary: 'bg-electric-magenta text-white',
      dark: 'bg-black text-white',
      dashed: 'bg-gray-100 border-dashed',
    };

    const shadowClasses = !noShadow && cn(
      'shadow-[4px_4px_0px_0px_#000000]',
      variant === 'secondary' && 'shadow-[4px_4px_0px_0px_#000000]',
    );

    const interactiveClasses = isInteractive && cn(
      'cursor-pointer',
      'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000]',
      'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
      'transition-all duration-150',
    );

    if (isInteractive) {
      return (
        <motion.div
          ref={ref}
          className={cn(
            baseClasses,
            variantClasses[variant],
            shadowClasses,
            interactiveClasses,
            className
          )}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={onClick}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          shadowClasses,
          interactiveClasses,
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BrutalistCard.displayName = 'BrutalistCard';

export default BrutalistCard;
