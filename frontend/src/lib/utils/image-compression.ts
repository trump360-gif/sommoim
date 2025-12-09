import imageCompression from 'browser-image-compression';

// ================================
// Types & Interfaces
// ================================

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

// ================================
// Constants
// ================================

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  quality: 0.8,
};

// ================================
// Helper Functions
// ================================

/**
 * 이미지 파일을 압축합니다.
 * @param file - 압축할 이미지 파일
 * @param options - 압축 옵션
 * @returns 압축된 이미지 파일
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // GIF는 압축하지 않음 (애니메이션 손실 방지)
  if (file.type === 'image/gif') {
    return file;
  }

  // 이미 충분히 작은 파일은 압축하지 않음
  const maxSize = (options.maxSizeMB || DEFAULT_OPTIONS.maxSizeMB!) * 1024 * 1024;
  if (file.size <= maxSize) {
    return file;
  }

  const compressionOptions = {
    maxSizeMB: options.maxSizeMB || DEFAULT_OPTIONS.maxSizeMB,
    maxWidthOrHeight: options.maxWidthOrHeight || DEFAULT_OPTIONS.maxWidthOrHeight,
    initialQuality: options.quality || DEFAULT_OPTIONS.quality,
    useWebWorker: true,
    fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);

    // 압축된 파일이 원본보다 큰 경우 원본 반환
    if (compressedFile.size >= file.size) {
      return file;
    }

    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // 압축 실패 시 원본 반환
    return file;
  }
}

/**
 * 프로필 이미지용 압축 (더 작은 크기)
 */
export async function compressProfileImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 500,
    quality: 0.85,
  });
}

/**
 * 배너/썸네일 이미지용 압축
 */
export async function compressBannerImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    quality: 0.8,
  });
}

/**
 * 활동 이미지용 압축
 */
export async function compressActivityImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    quality: 0.85,
  });
}
