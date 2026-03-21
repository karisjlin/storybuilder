import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-primary font-body"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-lg px-4 py-2.5 text-sm font-body',
          'bg-surface-700 border text-text-primary placeholder-text-muted',
          'transition-colors duration-150',
          error
            ? 'border-accent-red focus:border-accent-red focus:ring-accent-red'
            : 'border-surface-600 focus:border-accent-green focus:ring-accent-green',
          'focus:outline-none focus:ring-1',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p className="text-xs text-accent-red font-body mt-0.5">{error}</p>
      )}
    </div>
  );
}
