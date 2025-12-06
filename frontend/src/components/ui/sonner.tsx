'use client';

// ================================
// Imports
// ================================
import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from 'lucide-react';
import { Toaster as Sonner } from 'sonner';

// ================================
// Types & Interfaces
// ================================
type ToasterProps = React.ComponentProps<typeof Sonner>;

// ================================
// Component
// ================================
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-gray-500',
          actionButton:
            'group-[.toast]:bg-primary-600 group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500',
          success: 'group-[.toaster]:border-green-200',
          error: 'group-[.toaster]:border-red-200',
          warning: 'group-[.toaster]:border-yellow-200',
          info: 'group-[.toaster]:border-blue-200',
        },
      }}
      {...props}
    />
  );
};

// ================================
// Exports
// ================================
export { Toaster };
