'use client';

import { cn } from '@/lib/utils';

// ================================
// Types & Interfaces
// ================================

type AnimationType = 'none' | 'particles' | 'gradient' | 'wave';

interface HeroBackgroundProps {
  animation?: AnimationType;
  bgColor?: string;
  bgColorEnd?: string;
  bgImage?: string;
  className?: string;
}

// ================================
// Component
// ================================

export function HeroBackground({
  animation = 'none',
  bgColor = '#6366f1',
  bgColorEnd = '#8b5cf6',
  bgImage,
  className,
}: HeroBackgroundProps) {
  // ================================
  // Render
  // ================================

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden', className)}
      style={{
        background: bgImage
          ? `url(${bgImage}) center/cover`
          : `linear-gradient(135deg, ${bgColor} 0%, ${bgColorEnd} 100%)`,
      }}
    >
      {/* Overlay for image */}
      {bgImage && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${bgColor}cc 0%, ${bgColorEnd}cc 100%)`,
          }}
        />
      )}

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />

      {/* Animation: Particles */}
      {animation === 'particles' && (
        <div className="absolute inset-0">
          <div className="hero-particle hero-particle-1" />
          <div className="hero-particle hero-particle-2" />
          <div className="hero-particle hero-particle-3" />
          <div className="hero-particle hero-particle-4" />
          <div className="hero-particle hero-particle-5" />
        </div>
      )}

      {/* Animation: Gradient */}
      {animation === 'gradient' && (
        <div className="absolute inset-0 hero-gradient-animation" />
      )}

      {/* Animation: Wave */}
      {animation === 'wave' && (
        <div className="absolute inset-x-0 bottom-0 h-32">
          <svg
            className="absolute bottom-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="rgba(255,255,255,0.1)"
              className="hero-wave-1"
              d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
            <path
              fill="rgba(255,255,255,0.05)"
              className="hero-wave-2"
              d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,197.3C672,192,768,160,864,154.7C960,149,1056,171,1152,186.7C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>
      )}

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

      {/* Hero Background Styles */}
      <style jsx>{`
        .hero-particle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }
        .hero-particle-1 { top: 20%; left: 10%; animation-delay: 0s; }
        .hero-particle-2 { top: 60%; left: 20%; animation-delay: 1s; width: 8px; height: 8px; }
        .hero-particle-3 { top: 30%; left: 70%; animation-delay: 2s; width: 12px; height: 12px; }
        .hero-particle-4 { top: 70%; left: 80%; animation-delay: 3s; width: 6px; height: 6px; }
        .hero-particle-5 { top: 50%; left: 50%; animation-delay: 4s; width: 14px; height: 14px; }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
        }

        .hero-gradient-animation {
          background: linear-gradient(-45deg, ${bgColor}, ${bgColorEnd}, #3b82f6, #8b5cf6);
          background-size: 400% 400%;
          animation: gradient-shift 15s ease infinite;
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .hero-wave-1 {
          animation: wave-move 8s ease-in-out infinite;
        }
        .hero-wave-2 {
          animation: wave-move 10s ease-in-out infinite reverse;
        }

        @keyframes wave-move {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
        }
      `}</style>
    </div>
  );
}
