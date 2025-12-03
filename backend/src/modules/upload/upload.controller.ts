import { Controller, Post, Body } from '@nestjs/common';
import { UploadService } from './upload.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  getPresignedUrl(
    @CurrentUser('id') userId: string,
    @Body() body: { fileName: string; fileType: string; entityType?: string },
  ) {
    return this.uploadService.getPresignedUrl(userId, body.fileName, body.fileType, body.entityType);
  }

  @Post('confirm')
  confirmUpload(
    @CurrentUser('id') userId: string,
    @Body() body: {
      fileName: string;
      fileType: string;
      fileSize: number;
      url: string;
      key: string;
      entityType?: string;
      entityId?: string;
    },
  ) {
    return this.uploadService.confirmUpload(userId, body);
  }
}
