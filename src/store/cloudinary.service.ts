import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { Readable } from 'node:stream';

export interface CloudinaryAsset {
  url: string;
  publicId: string;
  originalName: string;
  resourceType: string;
}

@Injectable()
export class CloudinaryStore {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async upload(buffer: Buffer, originalName: string, folder: string): Promise<CloudinaryAsset> {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new ServiceUnavailableException('Cloudinary is not configured on the backend');
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto', use_filename: true, unique_filename: true },
        (error, response) => {
          if (error) reject(error);
          else if (response) resolve(response);
          else reject(new Error('Cloudinary returned no upload result'));
        },
      );
      Readable.from(buffer).pipe(stream);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      originalName,
      resourceType: result.resource_type,
    };
  }
}
