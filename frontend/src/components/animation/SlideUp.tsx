'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// ================================
// Types & Interfaces
// ================================

interface SlideUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

// ================================
// Component
// ================================

export function SlideUp({
  children,
  delay = 0,
  duration = 0.5,
  distance = 20,
  className = '',
}: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
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
