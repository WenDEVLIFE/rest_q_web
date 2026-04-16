import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = ({
  label,
  error,
  leftIcon,
  rightIcon,
  helperText,
  className = '',
  ...props
}: InputProps) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full min-h-11 py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm 
            focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary 
            transition-all placeholder:text-slate-400 font-medium
            ${leftIcon ? 'pl-11' : ''}
            ${rightIcon ? 'pr-11' : ''}
            ${error ? 'border-emergency bg-emergency/5' : ''}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[11px] font-bold text-emergency ml-1 mt-0.5">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-[10px] font-bold text-slate-400 ml-1 mt-0.5 italic">
          {helperText}
        </p>
      )}
    </div>
  );
};
