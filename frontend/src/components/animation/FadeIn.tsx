'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// ================================
// Types & Interfaces
// ================================

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

// ================================
// Component
// ================================

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className = '',
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
