'use client';

import { Fragment, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ================================
// Types & Interfaces
// ================================

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

interface SheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
}

// ================================
// Sheet Component
// ================================

export function Sheet({
  isOpen,
  onClose,
  children,
  side = 'right',
  className,
}: SheetProps) {
  // ================================
  // Effects
  // ================================

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ================================
  // Render
  // ================================

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Panel */}
      <div
        className={cn(
          'fixed z-50 flex h-full flex-col bg-white shadow-xl transition-transform duration-300',
          side === 'right' ? 'right-0 top-0' : 'left-0 top-0',
          side === 'right'
            ? 'translate-x-0 animate-slide-in-right'
            : 'translate-x-0 animate-slide-in-left',
          'w-full max-w-sm',
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {children}
      </div>
    </Fragment>
  );
}

// ================================
// Sheet Header
// ================================

export function SheetHeader({ children, className }: SheetHeaderProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  );
}

// ================================
// Sheet Title
// ================================

export function SheetTitle({ children, className }: SheetTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h2>
  );
}

// ================================
// Sheet Content
// ================================

export function SheetContent({ children, className }: SheetContentProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-6 py-4', className)}>
      {children}
    </div>
  );
}
