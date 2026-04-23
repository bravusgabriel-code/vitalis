import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'glass' | 'solid' | 'outline';
}

export const Card: React.FC<CardProps> = ({ children, className, variant = 'glass', ...props }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[16px] transition-all duration-300",
        variant === 'glass' && "glass bg-white/[0.015] border-white/[0.03] shadow-premium",
        variant === 'solid' && "bg-dark-surface border border-white/[0.04] shadow-premium",
        variant === 'outline' && "bg-transparent border border-white/[0.06]",
        "p-6 md:p-8",
        className
      )} 
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  ...props 
}) => {
  const variants = {
    primary: "bg-vibrant-orange text-white hover:bg-vibrant-orange/90 shadow-lg shadow-vibrant-orange/10",
    secondary: "bg-white/[0.03] text-white hover:bg-white/[0.06] border border-white/[0.05]",
    ghost: "bg-transparent text-muted-text hover:text-white hover:bg-white/[0.03]",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    accent: "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5",
    premium: "bg-orange-gradient text-white shadow-glow border-none",
  };

  const sizes = {
    sm: "px-4 py-2 text-[11px]",
    md: "px-6 py-2.5 text-[13px]",
    lg: "px-8 py-3.5 text-[15px]",
    xl: "px-10 py-5 text-lg",
    icon: "p-3 rounded-full",
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold tracking-tight transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const SectionTitle: React.FC<{ children: React.ReactNode; subtitle?: string }> = ({ children, subtitle }) => {
  return (
    <div className="mb-12">
      {subtitle && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[11px] text-muted-text font-bold uppercase tracking-[0.15em] mb-2"
        >
          {subtitle}
        </motion.p>
      )}
      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-3xl font-bold text-white tracking-tight"
      >
        {children}
      </motion.h2>
    </div>
  );
};
