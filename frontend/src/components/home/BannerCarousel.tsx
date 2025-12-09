'use client';

// ================================
// Imports
// ================================
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

// ================================
// Types
// ================================
interface BannerCarouselProps {
  banners: Banner[];
  onBannerClick?: (bannerId: string) => void;
}

// ================================
// Component
// ================================
export function BannerCarousel({ banners, onBannerClick }: BannerCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'center',
      skipSnaps: false,
    },
    [
      Autoplay({
        delay: 4000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  );

  // ================================
  // Callbacks
  // ================================
  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  // ================================
  // Effects
  // ================================
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // ================================
  // Handlers
  // ================================
  const handleBannerClick = (banner: Banner) => {
    if (onBannerClick) {
      onBannerClick(banner.id);
    }
  };

  // ================================
  // Render
  // ================================
  if (!banners || banners.length === 0) {
    return null;
  }

  // 배너가 1개일 때는 캐러셀 없이 표시
  if (banners.length === 1) {
    const banner = banners[0];
    return (
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SingleBanner banner={banner} onClick={() => handleBannerClick(banner)} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative">
        {/* Carousel Container */}
        <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
          <div className="flex">
            {banners.map((banner) => (
              <div key={banner.id} className="min-w-0 flex-[0_0_100%]">
                <BannerSlide banner={banner} onClick={() => handleBannerClick(banner)} />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={scrollPrev}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-50"
          aria-label="이전 배너"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-50"
          aria-label="다음 배너"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                selectedIndex === index
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              )}
              aria-label={`배너 ${index + 1}로 이동`}
            />
          ))}
        </div>

        {/* Counter Badge */}
        <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {selectedIndex + 1} / {banners.length}
        </div>
      </div>
    </section>
  );
}

// ================================
// Sub Components
// ================================
function BannerSlide({
  banner,
  onClick,
}: {
  banner: Banner;
  onClick: () => void;
}) {
  const content = (
    <div className="group relative aspect-[21/9] w-full overflow-hidden rounded-2xl">
      {banner.imageUrl ? (
        <Image
          src={banner.imageUrl}
          alt={banner.title || '배너'}
          fill
          priority
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: banner.backgroundColor || '#6366f1' }}
        />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Text Content */}
      {(banner.title || banner.subtitle) && (
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          {banner.title && (
            <h3 className="text-xl font-bold text-white md:text-2xl lg:text-3xl">
              {banner.title}
            </h3>
          )}
          {banner.subtitle && (
            <p className="mt-2 text-sm text-white/90 md:text-base">
              {banner.subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (banner.linkUrl) {
    return (
      <Link href={banner.linkUrl} onClick={onClick} className="block">
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className="cursor-default">
      {content}
    </div>
  );
}

function SingleBanner({
  banner,
  onClick,
}: {
  banner: Banner;
  onClick: () => void;
}) {
  const content = (
    <div className="group relative aspect-[21/9] w-full overflow-hidden rounded-2xl shadow-soft transition-all duration-300 hover:shadow-medium">
      {banner.imageUrl ? (
        <Image
          src={banner.imageUrl}
          alt={banner.title || '배너'}
          fill
          priority
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: banner.backgroundColor || '#6366f1' }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {(banner.title || banner.subtitle) && (
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          {banner.title && (
            <h3 className="text-xl font-bold text-white md:text-2xl lg:text-3xl">
              {banner.title}
            </h3>
          )}
          {banner.subtitle && (
            <p className="mt-2 text-sm text-white/90 md:text-base">
              {banner.subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (banner.linkUrl) {
    return (
      <Link href={banner.linkUrl} onClick={onClick} className="block">
        {content}
      </Link>
    );
  }

  return <div className="cursor-default">{content}</div>;
}

// ================================
// Skeleton
// ================================
export function BannerCarouselSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative aspect-[21/9] w-full animate-pulse overflow-hidden rounded-2xl bg-gray-200">
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="h-8 w-2/3 rounded bg-gray-300" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-300" />
        </div>
      </div>
    </section>
  );
}
