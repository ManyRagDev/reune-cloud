/**
 * BrutalistInput - Input com estilo neo-brutalista
 * Baseado no design das telas de novo_front/
 */

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type InputVariant = 'default' | 'large';

interface BaseProps {
  label?: string;
  error?: string;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

type InputProps = BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  multiline?: false;
};

type TextAreaProps = BaseProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & {
  multiline: true;
};

export type BrutalistInputProps = InputProps | TextAreaProps;

export const BrutalistInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, BrutalistInputProps>(
  ({ 
    label,
    error,
    variant = 'default',
    leftIcon,
    rightIcon,
    className,
    multiline,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const containerClasses = cn(
      'relative w-full',
    );

    const baseInputClasses = cn(
      // Base styles
      'w-full bg-white text-black font-display',
      'border-[3px] border-black',
      'shadow-[4px_4px_0px_0px_#000000]',
      // Focus styles
      'focus:outline-none focus:bg-acid-lime',
      'focus:translate-x-[2px] focus:translate-y-[2px]',
      'focus:shadow-[2px_2px_0px_0px_#000000]',
      // Transition
      'transition-all duration-150',
      // Placeholder
      'placeholder:text-black/30 placeholder:font-display',
      // Error state
      error && 'border-international-orange shadow-[4px_4px_0px_0px_#FF4800]',
      error && 'focus:shadow-[2px_2px_0px_0px_#FF4800]',
    );

    const sizeClasses = {
      default: cn(
        'px-4 py-3 text-base',
        leftIcon && 'pl-12',
        rightIcon && 'pr-12',
      ),
      large: cn(
        'px-4 py-4 text-xl font-bold uppercase',
        'placeholder:font-bold placeholder:uppercase',
        leftIcon && 'pl-14',
        rightIcon && 'pr-14',
      ),
    };

    const labelClasses = cn(
      'block font-mono text-sm font-bold uppercase tracking-wider',
      'mb-2 text-black',
      error && 'text-international-orange',
    );

    const iconContainerClasses = 'absolute top-1/2 -translate-y-1/2 text-black pointer-events-none';

    const InputComponent = multiline ? 'textarea' : 'input';

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={cn(iconContainerClasses, 'left-4 text-xl')}>
              {leftIcon}
            </div>
          )}
          
          {multiline ? (
            <textarea
              ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
              id={inputId}
              className={cn(
                baseInputClasses,
                sizeClasses[variant],
                'resize-none min-h-[120px]',
                className
              )}
              {...props as TextareaHTMLAttributes<HTMLTextAreaElement>}
            />
          ) : (
            <input
              ref={ref as React.ForwardedRef<HTMLInputElement>}
              id={inputId}
              className={cn(
                baseInputClasses,
                sizeClasses[variant],
                className
              )}
              {...props as InputHTMLAttributes<HTMLInputElement>}
            />
          )}
          
          {rightIcon && (
            <div className={cn(iconContainerClasses, 'right-4 text-xl')}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 font-mono text-xs text-international-orange font-bold">
            {error}
          </p>
        )}
      </div>
    );
  }
);

BrutalistInput.displayName = 'BrutalistInput';

export default BrutalistInput;
