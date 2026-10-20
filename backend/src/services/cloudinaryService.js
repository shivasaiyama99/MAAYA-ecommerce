import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { config } from '../config/env.js';

export class CloudinaryService {
  /**
   * Uploads an image from a Data URI or Base64 string to Cloudinary
   * @param {string} fileStr - Data URI or Base64 string
   * @param {string} folder - Destination folder on Cloudinary
   */
  static async uploadImage(fileStr, folder = 'sarees') {
    if (!isCloudinaryConfigured()) {
      if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
        console.warn('⚠️ Cloudinary not fully configured in dev/test. Generating mock persistent image reference.');
        const mockId = `sarees/dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return {
          publicId: mockId,
          url: fileStr.startsWith('data:image')
            ? fileStr
            : `https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80`,
          format: 'webp',
          width: 800,
          height: 1000,
        };
      }
      throw new Error('Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured.');
    }

    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1400, crop: 'limit' },
      ],
    });

    return {
      publicId: uploadResponse.public_id,
      url: uploadResponse.secure_url,
      format: uploadResponse.format,
      width: uploadResponse.width,
      height: uploadResponse.height,
    };
  }

  /**
   * Uploads an in-memory buffer directly to Cloudinary without writing to local disk
   * @param {Buffer} buffer - File buffer
   * @param {string} mimetype - MIME type (e.g. image/jpeg)
   * @param {string} folder - Destination folder
   */
  static async uploadBuffer(buffer, mimetype, folder = 'sarees') {
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    return await this.uploadImage(dataUri, folder);
  }

  /**
   * Deletes an image from Cloudinary by public ID
   * @param {string} publicId
   */
  static async deleteImage(publicId) {
    if (!publicId) return null;

    if (!isCloudinaryConfigured()) {
      return { result: 'ok', mock: true };
    }

    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn(`Failed to destroy Cloudinary image ${publicId}:`, err.message);
      return null;
    }
  }
}

export default CloudinaryService;
