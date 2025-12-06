'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { ActivityImage } from '@/lib/api/activities';

interface ImageGalleryProps {
  images: ActivityImage[];
  onDelete?: (imageId: string) => void;
  canDelete?: boolean;
}

export function ImageGallery({ images, onDelete, canDelete = false }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
        등록된 이미지가 없습니다
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {images.map((image, idx) => (
          <div
            key={image.id}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100"
            onClick={() => setSelectedIndex(idx)}
          >
            <Image
              src={image.imageUrl}
              alt={image.caption || `이미지 ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
            {canDelete && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(image.id);
                }}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        className="max-w-4xl"
      >
        {selectedIndex !== null && (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
              <Image
                src={images[selectedIndex].imageUrl}
                alt={images[selectedIndex].caption || '이미지'}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-contain"
              />
            </div>
            {images[selectedIndex].caption && (
              <p className="text-center text-gray-600">{images[selectedIndex].caption}</p>
            )}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={selectedIndex === 0}
              >
                이전
              </Button>
              <span className="text-sm text-gray-500">
                {selectedIndex + 1} / {images.length}
              </span>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={selectedIndex === images.length - 1}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
