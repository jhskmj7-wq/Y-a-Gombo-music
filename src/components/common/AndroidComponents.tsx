import React from 'react';
import { ChevronLeft } from 'lucide-react';

/* ============================================================================
 * ANDROID MATERIAL DESIGN 3 BUTTON
 * ============================================================================ */
interface AndroidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ElementType;
  children: React.ReactNode;
}

export const AndroidButton: React.FC<AndroidButtonProps> = ({
  variant = 'filled',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon: Icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = "relative inline-flex items-center justify-center font-bold tracking-wider uppercase select-none transition-transform duration-150 active:scale-[0.97] touch-manipulation cursor-pointer disabled:opacity-50 disabled:pointer-events-none";

  const sizeClasses = {
    sm: "min-h-[40px] px-3.5 py-1.5 text-[11px] rounded-xl gap-1.5",
    md: "min-h-[48px] px-5 py-2.5 text-xs rounded-2xl gap-2",
    lg: "min-h-[56px] px-6 py-3.5 text-sm rounded-2xl gap-2.5",
  }[size];

  const variantClasses = {
    filled: "bg-gradient-to-r from-[#E5C158] to-[#D4AF37] text-black shadow-md active:shadow-sm font-black",
    tonal: "bg-afri-bg-ter text-[#D4AF37] border border-[#D4AF37]/30 hover:border-[#D4AF37]",
    outlined: "bg-transparent text-afri-text border border-afri-border hover:border-[#D4AF37]",
    text: "bg-transparent text-[#D4AF37] hover:bg-white/5",
    danger: "bg-rose-600 text-white shadow-md active:shadow-sm",
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  );
};

/* ============================================================================
 * ANDROID MATERIAL DESIGN 3 CARD
 * ============================================================================ */
interface AndroidCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  clickable?: boolean;
}

export const AndroidCard: React.FC<AndroidCardProps> = ({
  children,
  variant = 'outlined',
  clickable = false,
  className = '',
  ...props
}) => {
  const variantClasses = {
    elevated: "bg-afri-bg-sec border border-afri-border/60 shadow-lg",
    outlined: "bg-afri-bg-sec border border-afri-border/80 shadow-sm",
    flat: "bg-afri-bg-ter border border-transparent",
  }[variant];

  const clickClasses = clickable ? "active:scale-[0.98] transition-transform duration-150 cursor-pointer touch-manipulation hover:border-[#D4AF37]/50" : "";

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 overflow-hidden box-border ${variantClasses} ${clickClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/* ============================================================================
 * ANDROID MATERIAL DESIGN 3 INPUT FIELD (16px base font prevents mobile auto-zoom)
 * ============================================================================ */
interface AndroidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
  helperText?: string;
}

export const AndroidInput: React.FC<AndroidInputProps> = ({
  label,
  error,
  icon: Icon,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-bold text-afri-text-sec uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-afri-text-sec pointer-events-none flex items-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-afri-bg-sec border ${
            error ? 'border-rose-500 text-rose-300' : 'border-afri-border text-afri-text focus:border-[#D4AF37]'
          } rounded-2xl ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-3 text-[15px] sm:text-sm placeholder:text-afri-text-sec/60 outline-none transition-colors min-h-[48px] touch-manipulation box-border ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-rose-400 font-medium pl-1">{error}</p>}
      {!error && helperText && <p className="text-[10px] text-afri-text-sec pl-1">{helperText}</p>}
    </div>
  );
};

/* ============================================================================
 * ANDROID MATERIAL DESIGN 3 TOP BAR
 * ============================================================================ */
interface AndroidTopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const AndroidTopBar: React.FC<AndroidTopBarProps> = ({
  title,
  subtitle,
  onBack,
  actions,
  className = '',
}) => {
  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && navigator?.vibrate) {
        navigator.vibrate(8);
      }
    } catch (_) {}
  };

  return (
    <div
      className={`sticky top-0 z-30 w-full bg-afri-bg/95 backdrop-blur-md border-b border-afri-border/60 px-3 py-2 flex items-center justify-between min-h-[56px] box-border select-none ${className}`}
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {onBack && (
          <button
            onClick={() => {
              triggerHaptic();
              onBack();
            }}
            className="w-10 h-10 rounded-full bg-afri-bg-sec border border-afri-border/80 flex items-center justify-center text-afri-text hover:text-[#D4AF37] active:scale-95 transition-transform shrink-0 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px]"
            aria-label="Retour"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-black text-afri-text uppercase tracking-tight truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-afri-text-sec truncate font-mono mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-1.5 shrink-0 pl-2">{actions}</div>}
    </div>
  );
};

/* ============================================================================
 * ANDROID CHIP / FILTER TAG
 * ============================================================================ */
interface AndroidChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ElementType;
}

export const AndroidChip: React.FC<AndroidChipProps> = ({
  label,
  selected = false,
  onClick,
  icon: Icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-transform duration-150 active:scale-95 cursor-pointer shrink-0 touch-manipulation ${
        selected
          ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-black shadow-sm'
          : 'bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </button>
  );
};
