import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.bucketName = this.config.get('CLOUDFLARE_BUCKET_NAME') || 'sommoim';
    this.publicUrl = this.config.get('R2_PUBLIC_URL') || '';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.get('CLOUDFLARE_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.get('CLOUDFLARE_ACCESS_KEY_ID') || '',
        secretAccessKey: this.config.get('CLOUDFLARE_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async getPresignedUrl(userId: string, fileName: string, fileType: string, entityType?: string) {
    this.validateFileType(fileType);

    const key = this.generateKey(userId, fileName, entityType);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    const publicUrl = `${this.publicUrl}/${key}`;

    return { presignedUrl, publicUrl, key };
  }

  async confirmUpload(userId: string, data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    key: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.prisma.uploadedFile.create({
      data: { userId, ...data },
    });
  }

  private validateFileType(fileType: string) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(fileType)) {
      throw new BadRequestException('지원하지 않는 파일 형식입니다');
    }
  }

  private generateKey(userId: string, fileName: string, entityType?: string): string {
    const ext = fileName.split('.').pop() || 'jpg';
    const uuid = uuidv4();
    const folder = entityType || 'general';
    return `uploads/${folder}/${userId}/${uuid}.${ext}`;
  }
}
