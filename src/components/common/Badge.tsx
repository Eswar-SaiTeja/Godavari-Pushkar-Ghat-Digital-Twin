import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'blue' | 'amber' | 'emerald' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'sm',
  pulse = false,
  className = '',
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/30',
    blue: 'bg-blue-950/80 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-950/80 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-950/80 text-rose-400 border-rose-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider font-semibold',
    md: 'text-xs px-2.5 py-1 tracking-wide font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border uppercase font-mono ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'cyan' ? 'bg-cyan-400' : 
            variant === 'emerald' ? 'bg-emerald-400' : 
            variant === 'amber' ? 'bg-amber-400' : 'bg-blue-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
            variant === 'cyan' ? 'bg-cyan-400' : 
            variant === 'emerald' ? 'bg-emerald-400' : 
            variant === 'amber' ? 'bg-amber-400' : 'bg-blue-400'
          }`} />
        </span>
      )}
      {children}
    </span>
  );
};
