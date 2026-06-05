import {
  Controller, Post, UploadedFile,
  UseGuards, UseInterceptors, BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('uploads')
export class UploadsController {
  private supabase;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_KEY'),
    );
    this.bucket = config.get('SUPABASE_BUCKET') ?? 'task-photos';
  }

  @Post('photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Seules les images sont acceptées'), false);
      }
      cb(null, true);
    },
  }))
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');

    const filename = `${uuid()}${extname(file.originalname)}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new InternalServerErrorException(`Upload échoué : ${error.message}`);

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filename);

    return { url: data.publicUrl };
  }
}
