

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, variant = 'primary', size = 'md', isLoading, children, ...props 
}) => {
  const base = 'inline-flex items-center justify-center rounded-md font-bold transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md hover:shadow-lg', // Blue
    secondary: 'bg-secondary text-white hover:opacity-90 focus:ring-cyan-500 shadow-md hover:shadow-lg', // Teal
    accent: 'bg-accent text-slate-900 hover:bg-yellow-400 focus:ring-yellow-500 shadow-md hover:shadow-lg', // Gold
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    outline: 'border-2 border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700 hover:border-slate-400'
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg'
  };

  return (
    <button 
      className={cn(base, variants[variant], sizes[size], className)} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};


// Card
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  children, className, title, action, ...props 
}) => (
  <div 
    className={cn("bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300", className)} 
    {...props}
  >
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
        <h3 className="font-bold text-lg text-slate-900 tracking-tight">{title}</h3>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);


// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
    <input
      className={cn(
        "block w-full rounded-md border-slate-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2 bg-white text-slate-900 transition-all duration-200 focus:shadow-md",
        error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "hover:border-slate-400",
        className
      )}
      {...props}
    />
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);
