'use client';

import { useCallback, useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ================================
// Types
// ================================
interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    className?: string;
    maxWidth?: number;
    maxHeight?: number;
    maxSizeMB?: number;
}

// ================================
// Constants
// ================================
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1080;
const DEFAULT_MAX_SIZE_MB = 2;

// ================================
// Component
// ================================
export function ImageUpload({
    value,
    onChange,
    onRemove,
    className,
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
}: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [preview, setPreview] = useState<string | null>(value || null);

    // ================================
    // Effects
    // ================================
    useEffect(() => {
        setPreview(value || null);
    }, [value]);

    // ================================
    // Helper Functions
    // ================================
    const compressImage = async (file: File): Promise<File> => {
        // Skip compression for small files or non-compressible formats
        if (file.size < 100 * 1024) { // Less than 100KB
            return file;
        }

        setUploadProgress('이미지 최적화 중...');

        const options = {
            maxSizeMB,
            maxWidthOrHeight: Math.max(maxWidth, maxHeight),
            useWebWorker: true,
            fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        };

        try {
            const compressedFile = await imageCompression(file, options);
            console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            return compressedFile;
        } catch (error) {
            console.warn('Image compression failed, using original:', error);
            return file;
        }
    };

    // ================================
    // Handlers
    // ================================
    const uploadImage = async (file: File) => {
        try {
            setIsUploading(true);
            setUploadProgress('준비 중...');

            // Compress image before upload
            const compressedFile = await compressImage(file);
            setUploadProgress('업로드 중...');

            // 1. Get presigned URL
            const presignedResponse = await fetch('/api/upload/presigned-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: compressedFile.name || file.name,
                    fileType: compressedFile.type || file.type,
                    entityType: 'banner',
                }),
            });

            if (!presignedResponse.ok) {
                throw new Error('Failed to get upload URL');
            }

            const { presignedUrl, publicUrl, key } = await presignedResponse.json();

            // 2. Upload compressed file to S3/R2
            const uploadResponse = await fetch(presignedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': compressedFile.type || file.type },
                body: compressedFile,
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
            }

            // 3. Confirm upload with compressed file info
            await fetch('/api/upload/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: compressedFile.name || file.name,
                    fileType: compressedFile.type || file.type,
                    fileSize: compressedFile.size,
                    url: publicUrl,
                    key,
                    entityType: 'banner',
                }),
            });

            // Update preview and notify parent
            setPreview(publicUrl);
            onChange(publicUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                uploadImage(file);
            }
        },
        []
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadImage(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onChange('');
        onRemove?.();
    };

    return (
        <div className={cn('relative', className)}>
            {preview ? (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="h-48 w-full rounded-lg object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                        'flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                        isDragging
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-gray-100',
                        isUploading && 'pointer-events-none opacity-50'
                    )}
                >
                    <label className="flex cursor-pointer flex-col items-center">
                        {isUploading ? (
                            <>
                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
                                <p className="mt-4 text-sm text-gray-600">{uploadProgress || '업로드 중...'}</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-12 w-12 text-gray-400" />
                                <p className="mt-4 text-sm font-medium text-gray-700">
                                    이미지를 드래그하거나 클릭하여 업로드
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    PNG, JPG, GIF, WEBP (최대 10MB)
                                </p>
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isUploading}
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
