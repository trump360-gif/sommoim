import { api } from './client';

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export interface UploadConfirmDto {
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  key: string;
  entityType?: string;
  entityId?: string;
}

export const uploadApi = {
  getPresignedUrl: (fileName: string, fileType: string, entityType?: string) =>
    api.post<PresignedUrlResponse>('/upload/presigned-url', { fileName, fileType, entityType }),

  confirmUpload: (data: UploadConfirmDto) =>
    api.post('/upload/confirm', data),
};

export async function uploadFile(
  file: File,
  entityType?: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const { uploadUrl, publicUrl, key } = await uploadApi.getPresignedUrl(
    file.name,
    file.type,
    entityType
  );

  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  await uploadApi.confirmUpload({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    url: publicUrl,
    key,
    entityType,
  });

  return publicUrl;
}
