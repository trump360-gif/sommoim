'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeroBackground } from './HeroBackground';
import { SlideUp } from '@/components/animation';
import type { PageSection } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

// ================================
// Types & Interfaces
// ================================

interface HeroButton {
  id: string;
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline';
  order: number;
}

interface HeroLayout {
  subtitle?: string;
  buttons?: HeroButton[];
  buttonText?: string;
  buttonLink?: string;
  secondButtonText?: string;
  secondButtonLink?: string;
  bgColor?: string;
  bgColorEnd?: string;
  bgImage?: string;
  bgAnimation?: 'none' | 'particles' | 'gradient' | 'wave';
}

interface HeroSectionProps {
  section: PageSection;
}

// ================================
// Helper Functions
// ================================

function getButtonVariantStyles(variant: HeroButton['variant']) {
  switch (variant) {
    case 'primary':
      return 'bg-white text-primary-600 hover:bg-gray-50 shadow-lg hover:shadow-xl';
    case 'secondary':
      return 'bg-white/20 text-white border-2 border-white/30 hover:bg-white/30';
    case 'outline':
      return 'bg-transparent text-white border-2 border-white hover:bg-white/10';
    default:
      return 'bg-white text-primary-600 hover:bg-gray-50';
  }
}

// ================================
// Component
// ================================

export function HeroSection({ section }: HeroSectionProps) {
  const heroLayout = (section.layoutJson || {}) as HeroLayout;

  // Build buttons array from either new format or legacy format
  const buttons: HeroButton[] = heroLayout.buttons?.length
    ? heroLayout.buttons.sort((a, b) => a.order - b.order)
    : [
        // Legacy support: convert old button fields to new format
        ...(heroLayout.buttonText
          ? [{
              id: 'legacy-1',
              text: heroLayout.buttonText,
              href: heroLayout.buttonLink || '/meetings',
              variant: 'primary' as const,
              order: 1,
            }]
          : [{
              id: 'default-1',
              text: '모임 찾아보기',
              href: '/meetings',
              variant: 'primary' as const,
              order: 1,
            }]),
        ...(heroLayout.secondButtonText
          ? [{
              id: 'legacy-2',
              text: heroLayout.secondButtonText,
              href: heroLayout.secondButtonLink || '/meetings/create',
              variant: 'secondary' as const,
              order: 2,
            }]
          : [{
              id: 'default-2',
              text: '모임 만들기',
              href: '/meetings/create',
              variant: 'secondary' as const,
              order: 2,
            }]),
      ];

  // ================================
  // Render
  // ================================

  return (
    <section className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Background */}
      <HeroBackground
        animation={heroLayout.bgAnimation || 'none'}
        bgColor={heroLayout.bgColor || '#6366f1'}
        bgColorEnd={heroLayout.bgColorEnd || '#8b5cf6'}
        bgImage={heroLayout.bgImage}
        className="rounded-3xl"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl text-center text-white">
        <SlideUp delay={0.1}>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {section.title || '관심사가 같은 사람들과 함께해요'}
          </h1>
        </SlideUp>

        <SlideUp delay={0.2}>
          <p className="mb-8 text-lg opacity-95 md:text-xl">
            {heroLayout.subtitle || '운동, 게임, 맛집, 여행... 다양한 모임에서 새로운 친구를 만나보세요'}
          </p>
        </SlideUp>

        <SlideUp delay={0.3}>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {buttons.map((button) => (
              <Link key={button.id} href={button.href}>
                <Button
                  className={cn(
                    'w-full px-8 py-6 text-base font-semibold transition-all hover:scale-105 sm:w-auto',
                    getButtonVariantStyles(button.variant)
                  )}
                >
                  {button.text}
                </Button>
              </Link>
            ))}
          </div>
        </SlideUp>
      </div>
    </section>
  );
}
