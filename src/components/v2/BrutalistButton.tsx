/**
 * BrutalistButton - Botão com estilo neo-brutalista
 * Baseado no design das telas de novo_front/
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface BrutalistButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const BrutalistButton = forwardRef<HTMLButtonElement, BrutalistButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      // Base styles
      'inline-flex items-center justify-center gap-2',
      'font-display font-bold uppercase tracking-tight',
      'border-[3px] border-black',
      'transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      // Interactive states
      'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000]',
      'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-[4px_4px_0px_0px_#000000]',
      // Full width
      fullWidth && 'w-full',
    );

    const variantClasses = {
      primary: cn(
        'bg-acid-lime text-black',
        'shadow-[4px_4px_0px_0px_#000000]',
        'hover:bg-[#b8e600]',
        'focus:ring-acid-lime',
      ),
      secondary: cn(
        'bg-electric-magenta text-white',
        'shadow-[4px_4px_0px_0px_#000000]',
        'hover:bg-[#e600e6]',
        'focus:ring-electric-magenta',
      ),
      dark: cn(
        'bg-black text-white',
        'shadow-[4px_4px_0px_0px_#000000]',
        'hover:bg-gray-900',
        'focus:ring-black',
      ),
      outline: cn(
        'bg-white text-black',
        'shadow-[4px_4px_0px_0px_#000000]',
        'hover:bg-gray-50',
        'focus:ring-gray-400',
      ),
      ghost: cn(
        'bg-transparent text-black border-transparent',
        'shadow-none',
        'hover:bg-black/5 hover:translate-x-0 hover:translate-y-0 hover:shadow-none',
        'active:translate-x-0 active:translate-y-0',
        'focus:ring-gray-400',
      ),
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-xs',
      md: 'px-4 py-3 text-sm',
      lg: 'px-6 py-4 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

BrutalistButton.displayName = 'BrutalistButton';

export default BrutalistButton;
